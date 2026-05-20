<?php

namespace App\Http\Controllers;

use App\Models\Clan;
use App\Models\ClanBuilding;
use App\Models\BuildingContribution;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class VillageController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if (!$user->clan_id) {
            return Inertia::render('VillageView', [
                'buildings'     => [],
                'userResources' => $this->userResources($user),
                'noClan'        => true,
            ]);
        }

        // Auto-create buildings for this clan if they don't exist yet
        $this->initBuildings($user->clan_id);

        $buildings = ClanBuilding::where('clan_id', $user->clan_id)
            ->with(['contributions' => function ($q) {
                $q->with('user:id,username')->latest()->limit(20);
            }])
            ->get()
            ->map(function ($b) {
                $config = $b->getConfig();
                return array_merge($b->toArray(), [
                    'label'            => $config['label'] ?? $b->type,
                    'icon'             => $config['icon'] ?? '🏗️',
                    'produces'         => $config['produces'] ?? null,
                    'production_rate'  => $b->getProductionPerHour(),
                    'upgrade_cost'     => $b->getUpgradeCost(),
                    'is_max_level'     => $b->isMaxLevel(),
                    'is_ready'         => $b->isReadyToUpgrade(),
                ]);
            });

        return Inertia::render('VillageView', [
            'buildings'     => $buildings,
            'userResources' => $this->userResources($user),
            'noClan'        => false,
        ]);
    }

    public function contribute(Request $request, ClanBuilding $building)
    {
        $request->validate([
            'wood'     => 'integer|min:0',
            'metal'    => 'integer|min:0',
            'food'     => 'integer|min:0',
            'gold'     => 'integer|min:0',
            'crystals' => 'integer|min:0',
        ]);

        $user = $request->user();

        if ($building->clan_id !== $user->clan_id) {
            return back()->withErrors(['message' => "Ce bâtiment n'appartient pas à votre clan."]);
        }

        if ($building->isMaxLevel()) {
            return back()->withErrors(['message' => "Ce bâtiment est déjà au niveau maximum."]);
        }

        $wood     = (int)($request->wood     ?? 0);
        $metal    = (int)($request->metal    ?? 0);
        $food     = (int)($request->food     ?? 0);
        $gold     = (int)($request->gold     ?? 0);
        $crystals = (int)($request->crystals ?? 0);

        if ($wood + $metal + $food + $gold + $crystals === 0) {
            return back()->withErrors(['message' => "Vous devez contribuer au moins une ressource."]);
        }

        $error = null;

        DB::transaction(function () use ($user, $building, $wood, $metal, $food, $gold, $crystals, &$error) {
            $b = ClanBuilding::where('id', $building->id)->lockForUpdate()->first();

            // Cap each resource to what is still missing for the upgrade
            $cost     = array_pad($b->getUpgradeCost() ?? [], 5, 0);
            $wood     = min($wood,     max(0, $cost[0] - $b->contributed_wood));
            $metal    = min($metal,    max(0, $cost[1] - $b->contributed_metal));
            $food     = min($food,     max(0, $cost[2] - $b->contributed_food));
            $gold     = min($gold,     max(0, $cost[3] - $b->contributed_gold));
            $crystals = min($crystals, max(0, $cost[4] - $b->contributed_crystals));

            if ($wood + $metal + $food + $gold + $crystals === 0) {
                $error = "Le bâtiment n'a besoin d'aucune contribution supplémentaire pour cette ressource.";
                return;
            }

            $u = User::where('id', $user->id)->lockForUpdate()->first();

            if ($u->wood < $wood || $u->metal < $metal || $u->food < $food
                || $u->gold < $gold || $u->crystals < $crystals) {
                $error = "Vous n'avez pas assez de ressources.";
                return;
            }

            $u->wood     -= $wood;
            $u->metal    -= $metal;
            $u->food     -= $food;
            $u->gold     -= $gold;
            $u->crystals -= $crystals;
            $u->save();

            $b->contributed_wood     += $wood;
            $b->contributed_metal    += $metal;
            $b->contributed_food     += $food;
            $b->contributed_gold     += $gold;
            $b->contributed_crystals += $crystals;

            if ($b->isReadyToUpgrade()) {
                $upgradeCost = array_pad($b->getUpgradeCost(), 5, 0);
                $b->level++;
                $b->contributed_wood     -= $upgradeCost[0];
                $b->contributed_metal    -= $upgradeCost[1];
                $b->contributed_food     -= $upgradeCost[2];
                $b->contributed_gold     -= $upgradeCost[3];
                $b->contributed_crystals -= $upgradeCost[4];
            }

            $b->save();

            BuildingContribution::create([
                'user_id'     => $user->id,
                'building_id' => $b->id,
                'wood'        => $wood,
                'metal'       => $metal,
                'food'        => $food,
                'gold'        => $gold,
                'crystals'    => $crystals,
            ]);
        });

        if ($error) {
            return back()->withErrors(['message' => $error]);
        }

        Clan::find($user->clan_id)?->recalculate();

        return back()->with('message', "Contribution enregistrée !");
    }

    public function collect(Request $request)
    {
        $user = $request->user();

        if (!$user->clan_id) {
            return back()->withErrors(['message' => "Vous n'êtes pas dans un clan."]);
        }

        $buildings = ClanBuilding::where('clan_id', $user->clan_id)
            ->whereNotNull('last_collected_at')
            ->orWhere(function ($q) use ($user) {
                $q->where('clan_id', $user->clan_id)->whereNull('last_collected_at');
            })
            ->get();

        $gained = ['wood' => 0, 'metal' => 0, 'food' => 0, 'gold' => 0];

        DB::transaction(function () use ($user, $buildings, &$gained) {
            foreach ($buildings as $building) {
                $config    = $building->getConfig();
                $produces  = $config['produces'] ?? null;
                if (!$produces) continue;

                $lastCollected  = $building->last_collected_at ?? $building->created_at;
                $secondsElapsed = max(0, now()->timestamp - $lastCollected->timestamp);
                $hoursElapsed   = $secondsElapsed / 3600;
                $amount         = (int)floor($building->getProductionPerHour() * $hoursElapsed);

                if ($amount > 0) {
                    $gained[$produces] += $amount;
                    $building->last_collected_at = now();
                    $building->save();
                }
            }

            if (array_sum($gained) > 0) {
                $u = User::where('id', $user->id)->lockForUpdate()->first();
                $u->wood  += $gained['wood'];
                $u->metal += $gained['metal'];
                $u->food  += $gained['food'];
                $u->gold  += $gained['gold'];
                $u->save();
            }
        });

        $summary = collect($gained)->filter()->map(fn ($v, $k) => "+{$v} " . ucfirst($k))->values()->implode(', ');
        $msg = $summary ? "Collecte : {$summary} !" : "Rien à collecter pour l'instant.";

        return back()->with('message', $msg);
    }

    private function userResources(User $user): array
    {
        return [
            'wood'     => $user->wood     ?? 0,
            'metal'    => $user->metal    ?? 0,
            'food'     => $user->food     ?? 0,
            'gold'     => $user->gold     ?? 0,
            'crystals' => $user->crystals ?? 0,
        ];
    }

    private function initBuildings(string $clanId): void
    {
        $types = array_keys(ClanBuilding::BUILDINGS_CONFIG);
        foreach ($types as $type) {
            ClanBuilding::firstOrCreate(
                ['clan_id' => $clanId, 'type' => $type],
                ['level' => 1, 'last_collected_at' => now()]
            );
        }
    }
}
