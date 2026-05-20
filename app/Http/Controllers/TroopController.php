<?php

namespace App\Http\Controllers;

use App\Models\SoldierType;
use App\Models\UserTroop;
use App\Models\War;
use App\Models\WarDeployment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TroopController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        $soldierTypes = SoldierType::all();

        $troops = UserTroop::where('user_id', $user->id)
            ->with('soldierType')
            ->get()
            ->keyBy('soldier_type_id');

        // Collect ready training
        foreach ($troops as $troop) {
            if ($troop->isTrainingComplete()) {
                $troop->quantity      += $troop->in_training;
                $troop->in_training    = 0;
                $troop->training_done_at = null;
                $troop->save();
            }
        }

        $activeCommander = $user->activeCommander()->with('commander')->first();
        $commanders      = $user->commanders()->with('commander')->get();

        $activeWar = null;
        if ($user->clan_id) {
            $activeWar = War::where(function ($q) use ($user) {
                $q->where('clan_a_id', $user->clan_id)->orWhere('clan_b_id', $user->clan_id);
            })->whereIn('status', ['pending', 'active'])->latest()->first();
        }

        $alreadyDeployed = $activeWar
            ? WarDeployment::where('war_id', $activeWar->id)->where('user_id', $user->id)->exists()
            : false;

        // Guérison automatique des blessés
        foreach ($troops as $troop) {
            if ($troop->wounded > 0 && $troop->healed_at && $troop->healed_at->isPast()) {
                $troop->quantity  += $troop->wounded;
                $troop->wounded    = 0;
                $troop->healed_at  = null;
                $troop->save();
            }
        }

        return Inertia::render('TroopsView', [
            'soldierTypes'    => $soldierTypes,
            'troops'          => $troops->values(),
            'commanders'      => $commanders,
            'activeCommander' => $activeCommander,
            'activeWar'       => $activeWar ? $activeWar->load(['clanA', 'clanB']) : null,
            'alreadyDeployed' => $alreadyDeployed,
            'userResources'   => [
                'wood'  => $user->wood,
                'metal' => $user->metal,
                'food'  => $user->food,
                'gold'  => $user->gold,
            ],
        ]);
    }

    public function train(Request $request)
    {
        $request->validate([
            'soldier_type_id' => 'required|exists:soldier_types,id',
            'quantity'        => 'required|integer|min:1|max:500',
        ]);

        $user       = auth()->user();
        $soldierType = SoldierType::findOrFail($request->soldier_type_id);

        $totalCostWood  = $soldierType->cost_wood  * $request->quantity;
        $totalCostMetal = $soldierType->cost_metal * $request->quantity;
        $totalCostFood  = $soldierType->cost_food  * $request->quantity;
        $totalCostGold  = $soldierType->cost_gold  * $request->quantity;

        if (
            $user->wood  < $totalCostWood  ||
            $user->metal < $totalCostMetal ||
            $user->food  < $totalCostFood  ||
            $user->gold  < $totalCostGold
        ) {
            return back()->withErrors(['message' => 'Ressources insuffisantes.']);
        }

        return DB::transaction(function () use ($user, $soldierType, $request, $totalCostWood, $totalCostMetal, $totalCostFood, $totalCostGold) {
            $user = \App\Models\User::where('id', $user->id)->lockForUpdate()->first();

            if (
                $user->wood  < $totalCostWood  ||
                $user->metal < $totalCostMetal ||
                $user->food  < $totalCostFood  ||
                $user->gold  < $totalCostGold
            ) {
                return back()->withErrors(['message' => 'Ressources insuffisantes.']);
            }

            $user->wood  -= $totalCostWood;
            $user->metal -= $totalCostMetal;
            $user->food  -= $totalCostFood;
            $user->gold  -= $totalCostGold;
            $user->save();

            $troop = UserTroop::firstOrCreate(
                ['user_id' => $user->id, 'soldier_type_id' => $soldierType->id],
                ['quantity' => 0, 'in_training' => 0]
            );

            // If already training the same type, add on top
            $newInTraining = $troop->in_training + $request->quantity;
            $trainingDone  = now()->addSeconds($soldierType->training_time * $request->quantity);

            $troop->in_training    = $newInTraining;
            $troop->training_done_at = $trainingDone;
            $troop->save();

            return back()->with('message', "{$request->quantity} {$soldierType->name}(s) en cours d'entraînement.");
        });
    }

    public function collect(Request $request)
    {
        $user   = auth()->user();
        $troops = UserTroop::where('user_id', $user->id)->get();
        $count  = 0;

        foreach ($troops as $troop) {
            if ($troop->isTrainingComplete()) {
                $troop->quantity       += $troop->in_training;
                $count                 += $troop->in_training;
                $troop->in_training     = 0;
                $troop->training_done_at = null;
                $troop->save();
            }
        }

        if ($count === 0) {
            return back()->withErrors(['message' => 'Aucune troupe prête à être récupérée.']);
        }

        return back()->with('message', "{$count} troupe(s) récupérée(s) !");
    }

    public function deploy(Request $request)
    {
        $request->validate([
            'troops' => 'required|array',
            'troops.*' => 'integer|min:0',
        ]);

        $user = auth()->user();

        if (!$user->clan_id) {
            return back()->withErrors(['message' => 'Vous devez être dans un clan pour déployer des troupes.']);
        }

        $activeWar = War::where(function ($q) use ($user) {
            $q->where('clan_a_id', $user->clan_id)->orWhere('clan_b_id', $user->clan_id);
        })->whereIn('status', ['pending', 'active'])->latest()->first();

        if (!$activeWar) {
            return back()->withErrors(['message' => 'Aucune guerre active en cours.']);
        }

        if (WarDeployment::where('war_id', $activeWar->id)->where('user_id', $user->id)->exists()) {
            return back()->withErrors(['message' => 'Vous avez déjà déployé vos troupes pour cette guerre.']);
        }

        $soldierTypes = SoldierType::all()->keyBy('id');
        $userTroops   = UserTroop::where('user_id', $user->id)->get()->keyBy('soldier_type_id');
        $deployedTroops = [];
        $totalDeployed  = 0;

        return DB::transaction(function () use ($user, $activeWar, $request, $soldierTypes, $userTroops, &$deployedTroops, &$totalDeployed) {
            foreach ($request->troops as $typeId => $qty) {
                $qty = (int) $qty;
                if ($qty <= 0) continue;

                if (!isset($soldierTypes[$typeId])) continue;

                $troop = $userTroops[$typeId] ?? null;
                if (!$troop || $troop->quantity < $qty) {
                    return back()->withErrors(['message' => "Pas assez de {$soldierTypes[$typeId]->name}."]);
                }

                $deployedTroops[$typeId] = $qty;
                $totalDeployed += $qty;
            }

            if ($totalDeployed === 0) {
                return back()->withErrors(['message' => 'Déployez au moins une troupe.']);
            }

            // Deduct troops
            foreach ($deployedTroops as $typeId => $qty) {
                $troop = UserTroop::where('user_id', $user->id)
                    ->where('soldier_type_id', $typeId)
                    ->lockForUpdate()
                    ->first();
                $troop->quantity -= $qty;
                $troop->save();
            }

            // Find active commander
            $activeUserCommander = $user->activeCommander()->first();

            // Calculate contribution score
            $score = $this->calculateScore($deployedTroops, $soldierTypes, $activeUserCommander);

            WarDeployment::create([
                'war_id'             => $activeWar->id,
                'user_id'            => $user->id,
                'clan_id'            => $user->clan_id,
                'commander_id'       => $activeUserCommander?->commander_id,
                'troops'             => $deployedTroops,
                'contribution_score' => $score,
            ]);

            return back()->with('message', "Troupes déployées ! Contribution : {$score} pts");
        });
    }

    private function calculateScore(array $troops, $soldierTypes, $activeUserCommander): int
    {
        $score = 0;
        $commanderEffect = $activeUserCommander?->commander?->effect_value ?? [];
        $effectType      = $activeUserCommander?->commander?->effect_type ?? '';

        foreach ($troops as $typeId => $qty) {
            $type   = $soldierTypes[$typeId] ?? null;
            if (!$type) continue;

            $atk = $type->attack;
            $def = $type->defense;

            // Apply commander bonuses
            if ($effectType === 'infantry_boost' && $type->slug === 'fantassin') {
                $atk *= (1 + ($commanderEffect['infantry_atk_bonus'] ?? 0));
            }
            if ($effectType === 'cavalry_charge' && $type->slug === 'cavalier') {
                $atk *= ($commanderEffect['cavalry_first_charge_multiplier'] ?? 1);
            }
            if ($effectType === 'shield_wall' && $type->slug === 'fantassin') {
                $def *= (1 + ($commanderEffect['infantry_def_bonus'] ?? 0));
            }
            if ($effectType === 'flanking') {
                // Flanking is applied during war resolution against enemy defense
            }
            if ($effectType === 'defensive_stance') {
                $def *= (1 + ($commanderEffect['def_bonus_defending'] ?? 0));
            }

            $score += (int) (($atk + $def * 0.5) * $qty);
        }

        // Barbarian fury: bonus per troop surviving (simplified: flat 10% on total)
        if ($effectType === 'barbarian_fury') {
            $score = (int) ($score * (1 + ($commanderEffect['atk_bonus_per_round'] ?? 0)));
        }

        return $score;
    }
}
