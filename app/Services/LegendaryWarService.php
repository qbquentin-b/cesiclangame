<?php

namespace App\Services;

use App\Models\Clan;
use App\Models\LegendaryWar;
use App\Models\LegendaryWarAction;
use App\Models\LegendaryWarClan;
use App\Models\LegendaryWarRound;
use App\Models\SoldierType;
use App\Models\User;
use App\Models\UserTroop;
use Illuminate\Support\Facades\DB;

class LegendaryWarService
{
    private const ROUND_DURATION_HOURS = 6;
    private const MORALE_DROP_PER_LOSS = 15;

    private const TACTICS = [
        'frontal_attack'   => ['atk_mult' => 1.3,  'win_loss' => 0.25, 'defeat_loss' => 0.50],
        'echelon_defense'  => ['atk_mult' => 0.7,  'win_loss' => 0.10, 'defeat_loss' => 0.20],
        'targeted_strike'  => ['atk_mult' => 1.1,  'win_loss' => 0.20, 'defeat_loss' => 0.35],
        'tactical_retreat' => ['atk_mult' => 0.0,  'win_loss' => 0.05, 'defeat_loss' => 0.05],
        'final_push'       => ['atk_mult' => 2.0,  'win_loss' => 0.40, 'defeat_loss' => 0.70],
    ];

    private const MORALE_THRESHOLDS = [70 => 1.0, 50 => 0.9, 30 => 0.8, 0 => 0.7];

    public function startWar(LegendaryWar $war): void
    {
        DB::transaction(function () use ($war) {
            LegendaryWarRound::where('legendary_war_id', $war->id)->delete();

            $startAt = $war->scheduled_at ?? now();

            for ($i = 1; $i <= $war->total_rounds; $i++) {
                LegendaryWarRound::create([
                    'legendary_war_id' => $war->id,
                    'round_number'     => $i,
                    'status'           => $i === 1 ? 'active' : 'pending',
                    'starts_at'        => $startAt->copy()->addHours(($i - 1) * self::ROUND_DURATION_HOURS),
                    'ends_at'          => $startAt->copy()->addHours($i * self::ROUND_DURATION_HOURS),
                ]);
            }

            $war->update(['status' => 'active', 'current_round' => 1]);
        });
    }

    public function resolveRound(LegendaryWarRound $round): void
    {
        DB::transaction(function () use ($round) {
            $war          = $round->legendaryWar;
            $soldierTypes = SoldierType::all()->keyBy('id');
            $actions      = $round->actions()->get();
            $participants = LegendaryWarClan::where('legendary_war_id', $war->id)
                ->whereNull('eliminated_round')
                ->get()
                ->keyBy('clan_id');

            // Compute score per clan for this round
            $clanScores = [];
            foreach ($participants as $clanId => $participant) {
                $clanActions = $actions->where('clan_id', $clanId);
                $morale      = $participant->morale ?? 100;
                $score       = $this->computeClanScore($clanActions, $soldierTypes, $morale);
                $clanScores[$clanId] = $score;
            }

            // Rank clans: winner = highest, loser = lowest
            arsort($clanScores);
            $rankedIds = array_keys($clanScores);
            $winnerId  = $rankedIds[0] ?? null;
            $loserId   = end($rankedIds) ?: null;

            // Update cumulative scores + morale
            foreach ($clanScores as $clanId => $score) {
                $participant = $participants[$clanId] ?? null;
                if (!$participant) continue;

                $participant->score += (int) $score;

                if ($clanId === $loserId && $loserId !== $winnerId) {
                    $participant->morale = max(0, ($participant->morale ?? 100) - self::MORALE_DROP_PER_LOSS);
                }

                $participant->save();
            }

            // Eliminate last-ranked clan (if more than 2 remain and it's not the last round)
            $eliminatedClanId = null;
            $activeCount = $participants->count();
            $isLastRound = $round->round_number >= $war->total_rounds;

            if ($activeCount > 2 && !$isLastRound && $loserId) {
                $loserPart = $participants[$loserId] ?? null;
                if ($loserPart) {
                    $loserPart->update(['eliminated_round' => $round->round_number]);
                    $eliminatedClanId = $loserId;
                }
            }

            // Apply troop losses per action
            foreach ($actions as $action) {
                $conf     = self::TACTICS[$action->tactic] ?? self::TACTICS['frontal_attack'];
                $isWinner = $action->clan_id === $winnerId;
                $lossRate = $isWinner ? $conf['win_loss'] : $conf['defeat_loss'];

                $troopsLost = [];
                foreach ($action->troops as $typeId => $qty) {
                    $lost = (int) ceil((int) $qty * $lossRate);
                    if ($lost > 0) {
                        $troopsLost[(string) $typeId] = min($lost, (int) $qty);
                    }
                }
                $action->update([
                    'contribution_score' => (int) ($clanScores[$action->clan_id] ?? 0),
                    'troops_lost'        => $troopsLost,
                ]);
            }

            $round->update([
                'status'            => 'finished',
                'clan_scores'       => $clanScores,
                'eliminated_clan_id' => $eliminatedClanId,
            ]);
        });
    }

    public function advanceRound(LegendaryWar $war): void
    {
        DB::transaction(function () use ($war) {
            $currentRound = LegendaryWarRound::where('legendary_war_id', $war->id)
                ->where('round_number', $war->current_round)
                ->first();

            if ($currentRound && $currentRound->status !== 'finished') {
                $this->resolveRound($currentRound);
            }

            $nextNumber = $war->current_round + 1;

            // Check if only 1 clan remains or all rounds done
            $activeCount = LegendaryWarClan::where('legendary_war_id', $war->id)
                ->whereNull('eliminated_round')
                ->count();

            if ($nextNumber > $war->total_rounds || $activeCount <= 1) {
                $this->resolveWar($war);
                return;
            }

            $nextRound = LegendaryWarRound::where('legendary_war_id', $war->id)
                ->where('round_number', $nextNumber)
                ->first();

            $nextRound?->update(['status' => 'active']);
            $war->update(['current_round' => $nextNumber]);
        });
    }

    public function resolveWar(LegendaryWar $war): void
    {
        $winner = LegendaryWarClan::where('legendary_war_id', $war->id)
            ->whereNull('eliminated_round')
            ->orderByDesc('score')
            ->first();

        $winnerId = $winner?->clan_id;

        $war->update([
            'status'         => 'finished',
            'winner_clan_id' => $winnerId,
        ]);

        // Return troops + wounded
        $this->returnTroops($war);

        if ($winnerId) {
            Clan::where('id', $winnerId)->increment('crystals_pool', 1000);
            User::where('clan_id', $winnerId)->increment('war_points', 25);
        }
    }

    private function returnTroops(LegendaryWar $war): void
    {
        $participants = LegendaryWarClan::where('legendary_war_id', $war->id)->get();

        foreach ($participants as $participant) {
            $userIds = User::where('clan_id', $participant->clan_id)->pluck('id');

            foreach ($userIds as $userId) {
                $actions = LegendaryWarAction::where('legendary_war_id', $war->id)
                    ->where('user_id', $userId)
                    ->get();

                $totalLost = [];
                $totalDeployed = [];

                foreach ($actions as $action) {
                    foreach ($action->troops as $typeId => $qty) {
                        $totalDeployed[(string) $typeId] = ($totalDeployed[(string) $typeId] ?? 0) + (int) $qty;
                    }
                    foreach ($action->troops_lost ?? [] as $typeId => $qty) {
                        $totalLost[(string) $typeId] = ($totalLost[(string) $typeId] ?? 0) + (int) $qty;
                    }
                }

                foreach ($totalDeployed as $typeId => $qty) {
                    $lost      = $totalLost[(string) $typeId] ?? 0;
                    $survivors = max(0, (int) $qty - $lost);
                    $wounded   = (int) ceil($lost * 0.5);

                    if ($survivors <= 0 && $wounded <= 0) continue;

                    $troop = UserTroop::where('user_id', $userId)
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
    }

    private function computeClanScore($actions, $soldierTypes, int $morale): float
    {
        $moralMult = $this->moralMultiplier($morale);
        $score     = 0.0;

        foreach ($actions as $action) {
            $conf        = self::TACTICS[$action->tactic] ?? self::TACTICS['frontal_attack'];
            $actionScore = 0.0;

            foreach ($action->troops as $typeId => $qty) {
                $type = $soldierTypes[(string) $typeId] ?? null;
                if (!$type || (int) $qty <= 0) continue;
                $basePower    = $type->attack + $type->defense * 0.5;
                $actionScore += $basePower * (int) $qty * $conf['atk_mult'];
            }

            $score += $actionScore;
        }

        return $score * $moralMult;
    }

    private function moralMultiplier(int $morale): float
    {
        foreach (self::MORALE_THRESHOLDS as $threshold => $mult) {
            if ($morale >= $threshold) return $mult;
        }
        return 0.7;
    }
}
