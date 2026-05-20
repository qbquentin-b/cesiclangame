<?php

namespace App\Services;

use App\Models\Clan;
use App\Models\MapZone;
use App\Models\SoldierType;
use App\Models\User;
use App\Models\UserTroop;
use App\Models\War;
use App\Models\WarDeployment;
use App\Models\WarRound;
use App\Models\WarRoundAction;
use Illuminate\Support\Facades\DB;

class WarService
{
    // Pentagone de contre-unités : slug attaquant → [slug cible => multiplicateur]
    private const COUNTER_MATRIX = [
        'cavalier'  => ['eclaireur' => 1.5],
        'eclaireur' => ['catapulte' => 1.5],
        'catapulte' => ['fantassin' => 1.5],
        'fantassin' => ['archer'    => 1.5],
        'archer'    => ['cavalier'  => 1.5],
    ];

    public const TACTICS = [
        'frontal_attack'   => ['atk_mult' => 1.3,  'win_loss' => 0.25, 'defeat_loss' => 0.50],
        'echelon_defense'  => ['atk_mult' => 0.7,  'win_loss' => 0.10, 'defeat_loss' => 0.20],
        'targeted_strike'  => ['atk_mult' => 1.1,  'win_loss' => 0.20, 'defeat_loss' => 0.35],
        'tactical_retreat' => ['atk_mult' => 0.0,  'win_loss' => 0.05, 'defeat_loss' => 0.05],
        'final_push'       => ['atk_mult' => 2.0,  'win_loss' => 0.40, 'defeat_loss' => 0.70],
    ];

    // Tactiques offensives et défensives pour le Conseil de guerre
    private const ASSAULT_TACTICS  = ['frontal_attack', 'final_push', 'targeted_strike'];
    private const DEFENSE_TACTICS  = ['echelon_defense', 'tactical_retreat'];
    private const STRATEGY_BONUS   = 0.10;

    // Moral — Idée 7
    private const MORALE_DROP_PER_LOSS = 15;
    private const MORALE_THRESHOLDS    = [70 => 1.0, 50 => 0.9, 30 => 0.8, 0 => 0.7];

    public function startWar(War $war): void
    {
        DB::transaction(function () use ($war) {
            $startAt       = $war->scheduled_at ?? now();
            $roundDuration = 6;
            $totalRounds   = $war->total_rounds ?: 4;

            if (!$war->total_rounds) {
                $war->update(['total_rounds' => $totalRounds]);
            }

            WarRound::where('war_id', $war->id)->delete();

            for ($i = 1; $i <= $totalRounds; $i++) {
                WarRound::create([
                    'war_id'       => $war->id,
                    'round_number' => $i,
                    'status'       => $i === 1 ? 'active' : 'pending',
                    'starts_at'    => $startAt->copy()->addHours(($i - 1) * $roundDuration),
                    'ends_at'      => $startAt->copy()->addHours($i * $roundDuration),
                ]);
            }

            $war->update(['status' => 'active', 'current_round' => 1, 'morale_a' => 100, 'morale_b' => 100]);
        });
    }

    /**
     * Troupes disponibles pour un joueur = pool initial - pertes cumulées.
     */
    public function availableTroops(string $warId, string $userId): array
    {
        $deployment = WarDeployment::where('war_id', $warId)
            ->where('user_id', $userId)
            ->first();

        if (!$deployment) return [];

        $initial   = $deployment->troops ?? [];
        $totalLost = [];

        WarRoundAction::where('war_id', $warId)
            ->where('user_id', $userId)
            ->whereNotNull('troops_lost')
            ->get()
            ->each(function ($action) use (&$totalLost) {
                foreach ($action->troops_lost as $typeId => $qty) {
                    $totalLost[$typeId] = ($totalLost[$typeId] ?? 0) + (int) $qty;
                }
            });

        $available = [];
        foreach ($initial as $typeId => $qty) {
            $remaining = (int) $qty - ($totalLost[$typeId] ?? 0);
            if ($remaining > 0) $available[$typeId] = $remaining;
        }

        return $available;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Calcul des scores d'un round
    // ──────────────────────────────────────────────────────────────────────────

    public function computeRoundScores(WarRound $round): array
    {
        $war          = $round->war;
        $actions      = $round->actions()->get();
        $soldierTypes = SoldierType::all()->keyBy('id');

        $actionsA = $actions->where('clan_id', $war->clan_a_id);
        $actionsB = $actions->where('clan_id', $war->clan_b_id);

        $troopsA = $this->aggregateTroops($actionsA);
        $troopsB = $this->aggregateTroops($actionsB);

        $scoreA = $this->calculateTacticScore($actionsA, $soldierTypes, $war, $round);
        $scoreB = $this->calculateTacticScore($actionsB, $soldierTypes, $war, $round);

        // Effets commandants
        $scoreA = $this->applyCommanderEffects($scoreA, $war, $war->clan_a_id, $scoreB, $round);
        $scoreB = $this->applyCommanderEffects($scoreB, $war, $war->clan_b_id, $scoreA, $round);

        // Bonus de contre-unités (avec effet Hannibal)
        $scoreA = $this->applyCounterBonus($scoreA, $troopsA, $troopsB, $soldierTypes, $war, $war->clan_a_id);
        $scoreB = $this->applyCounterBonus($scoreB, $troopsB, $troopsA, $soldierTypes, $war, $war->clan_b_id);

        return [(int) $scoreA, (int) $scoreB];
    }

    private function aggregateTroops($actions): array
    {
        $troops = [];
        foreach ($actions as $action) {
            foreach ($action->troops as $typeId => $qty) {
                $troops[(string) $typeId] = ($troops[(string) $typeId] ?? 0) + (int) $qty;
            }
        }
        return $troops;
    }

    /**
     * Score de base pour un ensemble d'actions :
     * - Multiplicateur tactique
     * - Alexandre le Grand (x2 cavaliers au round 1)
     * - Conseil de guerre : +10% si tactique correspond à la stratégie du clan
     */
    private function calculateTacticScore($actions, $soldierTypes, War $war, WarRound $round): float
    {
        $score = 0.0;

        $hasAlexA = $this->clanHasCommander($war, $war->clan_a_id, 'cavalry_charge');
        $hasAlexB = $this->clanHasCommander($war, $war->clan_b_id, 'cavalry_charge');

        foreach ($actions as $action) {
            $conf      = self::TACTICS[$action->tactic] ?? self::TACTICS['frontal_attack'];
            $isA       = $action->clan_id === $war->clan_a_id;
            $strategy  = $isA ? $war->strategy_a : $war->strategy_b;
            $hasAlex   = $isA ? $hasAlexA : $hasAlexB;
            $morale    = $isA ? ($war->morale_a ?? 100) : ($war->morale_b ?? 100);

            $actionScore = 0.0;
            foreach ($action->troops as $typeId => $qty) {
                $type = $soldierTypes[(string) $typeId] ?? null;
                if (!$type || (int) $qty <= 0) continue;

                $atk = $type->attack;

                if ($hasAlex && $round->round_number === 1 && $type->slug === 'cavalier') {
                    $alxVal = $this->getCommanderEffectValue($war, $action->clan_id, 'cavalry_charge');
                    $atk   *= ($alxVal['cavalry_first_charge_multiplier'] ?? 2.0);
                }

                $basePower    = $atk + $type->defense * 0.5;
                $actionScore += $basePower * (int) $qty * $conf['atk_mult'];
            }

            // Conseil de guerre
            if ($strategy) {
                $match = match ($strategy) {
                    'assault'  => in_array($action->tactic, self::ASSAULT_TACTICS),
                    'defense'  => in_array($action->tactic, self::DEFENSE_TACTICS),
                    default    => false,
                };
                if ($match) $actionScore *= (1 + self::STRATEGY_BONUS);
            }

            // Idée 7 — Moral : malus si moral bas
            $actionScore *= $this->moralMultiplier($morale);

            $score += $actionScore;
        }

        return $score;
    }

    private function moralMultiplier(int $morale): float
    {
        foreach (self::MORALE_THRESHOLDS as $threshold => $mult) {
            if ($morale >= $threshold) return $mult;
        }
        return 0.7;
    }

    /**
     * Effets des commandants sur le score total du clan.
     *
     * Narratifs ajoutés :
     * - Attila (barbarian_fury) : le bonus s'accumule par round (round_number × 10%)
     * - Napoléon (infantry_boost) : appliqué dans calculateTacticScore, pas ici
     */
    private function applyCommanderEffects(float $score, War $war, string $clanId, float $enemyScore, WarRound $round): float
    {
        $deployments = WarDeployment::where('war_id', $war->id)
            ->where('clan_id', $clanId)
            ->with('commander')
            ->get();

        foreach ($deployments as $dep) {
            $type  = $dep->commander?->effect_type ?? '';
            $value = $dep->commander?->effect_value ?? [];

            $score = match ($type) {
                'spy_and_debuff'    => $score * (1 + ($value['enemy_defense_reduction'] ?? 0)),
                'flanking'          => $score * (1 + ($value['defense_pierce'] ?? 0)),
                // Attila : bonus croissant par round
                'barbarian_fury'    => $score * (1 + ($value['atk_bonus_per_round'] ?? 0) * $round->round_number),
                'defensive_stance'  => $score * (1 + ($value['def_bonus_defending'] ?? 0)),
                'underdog_bonus'    => $score < $enemyScore
                    ? $score * (1 + ($value['atk_bonus_when_losing'] ?? 0))
                    : $score,
                // Jules César : bouclier de mur — bonus défensif général
                'shield_wall'       => $score * (1 + ($value['infantry_def_bonus'] ?? 0) * 0.5),
                // Saladin : forteresse — bonus si le clan possède une zone (réduction pertes négligeable ici)
                'fortified_defense' => $score * (1 + ($value['defense_on_owned_zone'] ?? 0) * 0.5),
                default => $score,
            };
        }

        return $score;
    }

    /**
     * Bonus de contre-unités.
     * Hannibal (flanking) réduit de defense_pierce le bonus de contre reçu par l'ennemi.
     */
    private function applyCounterBonus(float $score, array $myTroops, array $enemyTroops, $soldierTypes, War $war, string $myClanId): float
    {
        $slugToId = $soldierTypes->pluck('id', 'slug');
        $bonus    = 0.0;

        // L'ennemi a-t-il Hannibal déployé ? Il réduit notre bonus de contre.
        $enemyClanId   = $war->clan_a_id === $myClanId ? $war->clan_b_id : $war->clan_a_id;
        $enemyHannibal = $this->getCommanderEffectValue($war, $enemyClanId, 'flanking');
        $counterReduce = $enemyHannibal ? ($enemyHannibal['defense_pierce'] ?? 0) : 0;

        foreach (self::COUNTER_MATRIX as $mySlug => $counters) {
            $myId = (string) ($slugToId[$mySlug] ?? '');
            if (!$myId || !isset($myTroops[$myId])) continue;

            foreach ($counters as $enemySlug => $mult) {
                $enemyId = (string) ($slugToId[$enemySlug] ?? '');
                if (!$enemyId || !isset($enemyTroops[$enemyId])) continue;

                $myCount    = $myTroops[$myId];
                $enemyCount = $enemyTroops[$enemyId];

                if ($myCount > 0 && $enemyCount > 0) {
                    $type      = $soldierTypes[$myId];
                    $effective = min($myCount, $enemyCount);
                    $effectiveMult = max(0, $mult - 1.0 - $counterReduce);
                    $bonus    += ($type->attack + $type->defense * 0.5) * $effective * $effectiveMult;
                }
            }
        }

        return $score + $bonus;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Résolution d'un round
    // ──────────────────────────────────────────────────────────────────────────

    public function resolveRound(WarRound $round): void
    {
        DB::transaction(function () use ($round) {
            [$scoreA, $scoreB] = $this->computeRoundScores($round);

            $round->update([
                'status'  => 'finished',
                'score_a' => $scoreA,
                'score_b' => $scoreB,
            ]);

            $war          = $round->war;
            $winnerClanId = match (true) {
                $scoreA > $scoreB => $war->clan_a_id,
                $scoreB > $scoreA => $war->clan_b_id,
                default           => null,
            };

            // Idée 7 — Moral : le perdant du round baisse de 15 pts
            if ($winnerClanId) {
                $loserIsA = $winnerClanId === $war->clan_a_id ? false : true;
                $field    = $loserIsA ? 'morale_a' : 'morale_b';
                $current  = $loserIsA ? ($war->morale_a ?? 100) : ($war->morale_b ?? 100);
                $war->update([$field => max(0, $current - self::MORALE_DROP_PER_LOSS)]);
                $war->refresh();
            }

            $hasJeanneA = $this->clanHasCommander($war, $war->clan_a_id, 'underdog_bonus');
            $hasJeanneB = $this->clanHasCommander($war, $war->clan_b_id, 'underdog_bonus');

            foreach ($round->actions as $action) {
                $conf     = self::TACTICS[$action->tactic] ?? self::TACTICS['frontal_attack'];
                $isWinner = $winnerClanId && $winnerClanId === $action->clan_id;
                $lossRate = $isWinner ? $conf['win_loss'] : $conf['defeat_loss'];

                // Jeanne d'Arc — Round 1 : les perdants ne perdent aucune troupe
                $isA       = $action->clan_id === $war->clan_a_id;
                $hasJeanne = $isA ? $hasJeanneA : $hasJeanneB;
                if ($hasJeanne && $round->round_number === 1 && !$isWinner) {
                    $lossRate = 0;
                }

                $troopsLost = [];
                foreach ($action->troops as $typeId => $qty) {
                    $lost = (int) ceil((int) $qty * $lossRate);
                    if ($lost > 0) {
                        $troopsLost[(string) $typeId] = min($lost, (int) $qty);
                    }
                }

                $roundScore = $isWinner ? max($scoreA, $scoreB) : 0;
                $action->update([
                    'contribution_score' => $roundScore,
                    'troops_lost'        => $troopsLost,
                ]);
            }

            // Gengis Khan — Pillage immédiat à chaque round gagné
            if ($winnerClanId) {
                $this->applyGengisRoundPillage($war, $winnerClanId);
            }
        });
    }

    /**
     * Gengis Khan : vole 5% de bois + métal à l'ennemi au round gagné.
     */
    private function applyGengisRoundPillage(War $war, string $winnerClanId): void
    {
        $hasGengis = $this->clanHasCommander($war, $winnerClanId, 'pillage');
        if (!$hasGengis) return;

        $loserClanId = $war->clan_a_id === $winnerClanId ? $war->clan_b_id : $war->clan_a_id;
        $pillageRate = 0.05;

        $totalWood  = 0;
        $totalMetal = 0;

        foreach (User::where('clan_id', $loserClanId)->get() as $member) {
            $w = (int) ($member->wood  * $pillageRate);
            $m = (int) ($member->metal * $pillageRate);
            if ($w > 0) { $member->decrement('wood',  $w); $totalWood  += $w; }
            if ($m > 0) { $member->decrement('metal', $m); $totalMetal += $m; }
        }

        $count = User::where('clan_id', $winnerClanId)->count();
        if ($count > 0 && ($totalWood + $totalMetal) > 0) {
            User::where('clan_id', $winnerClanId)->increment('wood',  (int) ($totalWood  / $count));
            User::where('clan_id', $winnerClanId)->increment('metal', (int) ($totalMetal / $count));
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Avancement + résolution finale
    // ──────────────────────────────────────────────────────────────────────────

    public function advanceRound(War $war): void
    {
        DB::transaction(function () use ($war) {
            $currentRound = WarRound::where('war_id', $war->id)
                ->where('round_number', $war->current_round)
                ->first();

            if ($currentRound && $currentRound->status !== 'finished') {
                $this->resolveRound($currentRound);
            }

            $nextNumber = $war->current_round + 1;

            if ($nextNumber > $war->total_rounds) {
                $this->resolveWar($war);
                return;
            }

            $nextRound = WarRound::where('war_id', $war->id)
                ->where('round_number', $nextNumber)
                ->first();

            $nextRound?->update(['status' => 'active']);
            $war->update(['current_round' => $nextNumber]);
        });
    }

    public function resolveWar(War $war): void
    {
        $rounds  = WarRound::where('war_id', $war->id)->get();
        $totalA  = $rounds->sum('score_a');
        $totalB  = $rounds->sum('score_b');

        $winnerId = match (true) {
            $totalA > $totalB => $war->clan_a_id,
            $totalB > $totalA => $war->clan_b_id,
            default           => null,
        };

        $war->update([
            'status'    => 'finished',
            'winner_id' => $winnerId,
            'score_a'   => $totalA,
            'score_b'   => $totalB,
        ]);

        $this->returnTroops($war);

        if ($winnerId) {
            Clan::where('id', $winnerId)->increment('crystals_pool', 500);
            User::where('clan_id', $winnerId)->increment('war_points', 10);
            $this->applyPillage($war, $winnerId);

            // Idée 4 — Transfert de zone au vainqueur
            if ($war->zone_id) {
                MapZone::where('id', $war->zone_id)->update([
                    'clan_id'              => $winnerId,
                    'conquering_clan_id'   => null,
                    'conquest_started_at'  => null,
                ]);
            }

            // Conseil de guerre — stratégie pillage : bonus 10% ressources supplémentaires
            $winnerIsA = $winnerId === $war->clan_a_id;
            $strategy  = $winnerIsA ? $war->strategy_a : $war->strategy_b;
            if ($strategy === 'pillage') {
                $loserClanId = $winnerIsA ? $war->clan_b_id : $war->clan_a_id;
                $this->applyStrategyPillageBonus($war, $winnerId, $loserClanId);
            }
        }

        Clan::find($war->clan_a_id)?->recalculate();
        Clan::find($war->clan_b_id)?->recalculate();
    }

    /**
     * Bonus +10% pillage si stratégie 'pillage' active.
     */
    private function applyStrategyPillageBonus(War $war, string $winnerClanId, string $loserClanId): void
    {
        $totalWood  = 0;
        $totalMetal = 0;

        foreach (User::where('clan_id', $loserClanId)->get() as $member) {
            $w = (int) ($member->wood  * 0.10);
            $m = (int) ($member->metal * 0.10);
            if ($w > 0) { $member->decrement('wood',  $w); $totalWood  += $w; }
            if ($m > 0) { $member->decrement('metal', $m); $totalMetal += $m; }
        }

        $count = User::where('clan_id', $winnerClanId)->count();
        if ($count > 0 && ($totalWood + $totalMetal) > 0) {
            User::where('clan_id', $winnerClanId)->increment('wood',  (int) ($totalWood  / $count));
            User::where('clan_id', $winnerClanId)->increment('metal', (int) ($totalMetal / $count));
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Round bonus Napoléon
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Ajoute un round supplémentaire si le clan a Napoléon et est en train de perdre.
     * Peut être déclenché une seule fois par guerre par un chef/officier.
     */
    public function triggerNapoleonBonus(War $war, string $clanId): bool
    {
        if ($war->napoleon_bonus_used) return false;
        if (!$this->clanHasCommander($war, $clanId, 'infantry_boost')) return false;

        $rounds = WarRound::where('war_id', $war->id)->where('status', 'finished')->get();
        if ($rounds->count() < 2) return false;

        $isA     = $clanId === $war->clan_a_id;
        $myScore = $rounds->sum($isA ? 'score_a' : 'score_b');
        $hisScore = $rounds->sum($isA ? 'score_b' : 'score_a');
        if ($myScore >= $hisScore) return false;

        DB::transaction(function () use ($war) {
            $newNumber = $war->total_rounds + 1;
            $lastRound = WarRound::where('war_id', $war->id)->orderByDesc('round_number')->first();
            $newStart  = $lastRound ? $lastRound->ends_at : now();

            WarRound::create([
                'war_id'       => $war->id,
                'round_number' => $newNumber,
                'status'       => 'pending',
                'starts_at'    => $newStart,
                'ends_at'      => $newStart->copy()->addHours(6),
            ]);

            $war->update([
                'total_rounds'         => $newNumber,
                'napoleon_bonus_used'  => true,
            ]);
        });

        return true;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Conseil de guerre
    // ──────────────────────────────────────────────────────────────────────────

    public function setStrategy(War $war, string $clanId, string $strategy): void
    {
        $field = $war->clan_a_id === $clanId ? 'strategy_a' : 'strategy_b';
        $war->update([$field => $strategy]);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Retour des troupes + blessés
    // ──────────────────────────────────────────────────────────────────────────

    private function returnTroops(War $war): void
    {
        $deployments = WarDeployment::where('war_id', $war->id)->get();

        foreach ($deployments as $dep) {
            $initial   = $dep->troops ?? [];
            $totalLost = [];

            WarRoundAction::where('war_id', $war->id)
                ->where('user_id', $dep->user_id)
                ->whereNotNull('troops_lost')
                ->get()
                ->each(function ($action) use (&$totalLost) {
                    foreach ($action->troops_lost as $typeId => $qty) {
                        $totalLost[(string) $typeId] = ($totalLost[(string) $typeId] ?? 0) + (int) $qty;
                    }
                });

            foreach ($initial as $typeId => $qty) {
                $lost      = $totalLost[(string) $typeId] ?? 0;
                $survivors = max(0, (int) $qty - $lost);
                $wounded   = (int) ceil($lost * 0.5);

                if ($survivors <= 0 && $wounded <= 0) continue;

                $troop = UserTroop::where('user_id', $dep->user_id)
                    ->where('soldier_type_id', $typeId)
                    ->first();

                if ($troop) {
                    $troop->quantity += $survivors;
                    $troop->wounded  += $wounded;
                    if ($wounded > 0 && (!$troop->healed_at || $troop->healed_at->isPast())) {
                        $troop->healed_at = now()->addHours(8);
                    }
                    $troop->save();
                }
            }
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Pillage post-guerre (commandant Gengis Khan)
    // ──────────────────────────────────────────────────────────────────────────

    private function applyPillage(War $war, string $winnerClanId): void
    {
        $hasPillage = WarDeployment::where('war_id', $war->id)
            ->where('clan_id', $winnerClanId)
            ->whereHas('commander', fn($q) => $q->where('effect_type', 'pillage'))
            ->exists();

        if (!$hasPillage) return;

        $loserClanId = $war->clan_a_id === $winnerClanId ? $war->clan_b_id : $war->clan_a_id;

        $totalWood  = 0;
        $totalMetal = 0;

        foreach (User::where('clan_id', $loserClanId)->get() as $member) {
            $w = (int) ($member->wood  * 0.15);
            $m = (int) ($member->metal * 0.15);
            $member->decrement('wood', $w);
            $member->decrement('metal', $m);
            $totalWood  += $w;
            $totalMetal += $m;
        }

        $count = User::where('clan_id', $winnerClanId)->count();
        if ($count > 0) {
            User::where('clan_id', $winnerClanId)->increment('wood',  (int) ($totalWood  / $count));
            User::where('clan_id', $winnerClanId)->increment('metal', (int) ($totalMetal / $count));
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Compatibilité legacy (admin)
    // ──────────────────────────────────────────────────────────────────────────

    public function resolve(War $war, ?int $manualScoreA = null, ?int $manualScoreB = null, ?string $manualWinnerId = null): void
    {
        DB::transaction(function () use ($war, $manualScoreA, $manualScoreB, $manualWinnerId) {
            if ($manualScoreA !== null) {
                $scoreA   = $manualScoreA;
                $scoreB   = $manualScoreB ?? 0;
                $winnerId = $manualWinnerId;
            } else {
                $rounds = WarRound::where('war_id', $war->id)->where('status', 'finished')->get();
                if ($rounds->isNotEmpty()) {
                    $scoreA = $rounds->sum('score_a');
                    $scoreB = $rounds->sum('score_b');
                } else {
                    [$scoreA, $scoreB] = $this->computeLegacyScores($war);
                }
                $winnerId = $scoreA > $scoreB ? $war->clan_a_id : ($scoreB > $scoreA ? $war->clan_b_id : null);
            }

            $war->update([
                'status'    => 'finished',
                'winner_id' => $winnerId,
                'score_a'   => $scoreA,
                'score_b'   => $scoreB,
            ]);

            $this->returnTroops($war);

            if ($winnerId) {
                Clan::where('id', $winnerId)->increment('crystals_pool', 500);
                User::where('clan_id', $winnerId)->increment('war_points', 10);
                $this->applyPillage($war, $winnerId);

                if ($war->zone_id) {
                    MapZone::where('id', $war->zone_id)->update([
                        'clan_id'             => $winnerId,
                        'conquering_clan_id'  => null,
                        'conquest_started_at' => null,
                    ]);
                }
            }
        });
    }

    public function computeLegacyScores(War $war): array
    {
        $deployments  = WarDeployment::where('war_id', $war->id)->with('commander')->get();
        $soldierTypes = SoldierType::all()->keyBy('id');

        $scoreA = 0.0;
        $scoreB = 0.0;

        foreach ($deployments as $dep) {
            $base = 0.0;
            foreach ($dep->troops ?? [] as $typeId => $qty) {
                $type = $soldierTypes[(string) $typeId] ?? null;
                if ($type) $base += ($type->attack + $type->defense * 0.5) * (int) $qty;
            }
            if ($dep->clan_id === $war->clan_a_id) $scoreA += $base;
            else $scoreB += $base;
        }

        return [(int) $scoreA, (int) $scoreB];
    }

    public function computeScores(War $war): array
    {
        [$scoreA, $scoreB] = $this->computeLegacyScores($war);
        $winner = match (true) {
            $scoreA > $scoreB => $war->clan_a_id,
            $scoreB > $scoreA => $war->clan_b_id,
            default           => null,
        };
        return [$scoreA, $scoreB, $winner];
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Helpers commandants
    // ──────────────────────────────────────────────────────────────────────────

    public function clanHasCommander(War $war, string $clanId, string $effectType): bool
    {
        return WarDeployment::where('war_id', $war->id)
            ->where('clan_id', $clanId)
            ->whereHas('commander', fn($q) => $q->where('effect_type', $effectType))
            ->exists();
    }

    private function getCommanderEffectValue(War $war, string $clanId, string $effectType): ?array
    {
        $dep = WarDeployment::where('war_id', $war->id)
            ->where('clan_id', $clanId)
            ->whereHas('commander', fn($q) => $q->where('effect_type', $effectType))
            ->with('commander')
            ->first();

        return $dep?->commander?->effect_value;
    }
}
