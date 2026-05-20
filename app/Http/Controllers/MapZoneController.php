<?php

namespace App\Http\Controllers;

use App\Models\MapZone;
use App\Models\War;
use App\Services\WarService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MapZoneController extends Controller
{
    // Cost in crystals from the clan treasury
    const TERRAIN_COSTS = [
        'plains'   => 50,
        'forest'   => 120,
        'desert'   => 180,
        'mountain' => 300,
    ];

    // Duration in minutes to conquer the terrain
    const TERRAIN_DURATIONS = [
        'plains'   => 5,
        'forest'   => 15,
        'desert'   => 30,
        'mountain' => 60,
    ];

    public function index()
    {
        $this->resolveExpiredConquests();

        $user  = auth()->user();
        $zones = MapZone::with('clan:id,name,color', 'conqueringClan:id,name,color', 'zoneBuildings')->get();

        // Guerres actives du clan — map clanId => warId pour le frontend
        $activeWarsByClan = [];
        if ($user->clan_id) {
            War::whereIn('status', ['pending', 'active'])
                ->where(fn($q) => $q->where('clan_a_id', $user->clan_id)->orWhere('clan_b_id', $user->clan_id))
                ->get()
                ->each(function ($war) use ($user, &$activeWarsByClan) {
                    $enemyClanId = $war->clan_a_id === $user->clan_id ? $war->clan_b_id : $war->clan_a_id;
                    $activeWarsByClan[$enemyClanId] = $war->id;
                });
        }

        return Inertia::render('MapView', [
            'zones'             => $zones,
            'terrainCosts'      => self::TERRAIN_COSTS,
            'terrainDurations'  => self::TERRAIN_DURATIONS,
            'buildingTypes'     => \App\Models\ZoneBuilding::TYPES,
            'activeWarsByClan'  => $activeWarsByClan,
        ]);
    }

    private function resolveExpiredConquests(): void
    {
        $pending = MapZone::whereNotNull('conquering_clan_id')
            ->whereNotNull('conquest_started_at')
            ->get();

        $recalcIds = [];

        foreach ($pending as $zone) {
            $minutes = self::TERRAIN_DURATIONS[$zone->type] ?? 10;
            if (now()->isAfter($zone->conquest_started_at->addMinutes($minutes))) {
                $recalcIds[] = $zone->conquering_clan_id;
                $zone->clan_id             = $zone->conquering_clan_id;
                $zone->conquering_clan_id  = null;
                $zone->conquest_started_at = null;
                $zone->save();
            }
        }

        foreach (array_unique($recalcIds) as $clanId) {
            \App\Models\Clan::find($clanId)?->recalculate();
        }
    }

    public function claim(Request $request, MapZone $zone)
    {
        $user = $request->user();

        if (!$user->clan_id) {
            return back()->withErrors(['message' => "Vous devez être dans un clan pour revendiquer des terres."]);
        }

        if ($user->clan_rank !== 'leader' && $user->clan_rank !== 'officer') {
            return back()->withErrors(['message' => "Seuls les leaders ou officiers peuvent revendiquer des terres."]);
        }

        if ($zone->clan_id !== null) {
            return back()->withErrors(['message' => "Cette zone appartient déjà à un autre clan."]);
        }

        if ($zone->conquering_clan_id !== null) {
            return back()->withErrors(['message' => "Ce territoire est déjà en cours de conquête par un autre clan."]);
        }

        $cost     = self::TERRAIN_COSTS[$zone->type] ?? 100;
        $duration = self::TERRAIN_DURATIONS[$zone->type] ?? 10;

        $error = null;

        DB::transaction(function () use ($user, $zone, $cost, $duration, &$error) {
            $clan = DB::table('clans')->where('id', $user->clan_id)->first();

            if ($clan->crystals_pool < $cost) {
                $error = "Trésorerie insuffisante ! La conquête de « {$zone->name} » requiert {$cost} 💎. Votre clan n'en possède que {$clan->crystals_pool}.";
                return;
            }

            $clanZoneCount = MapZone::where('clan_id', $clan->id)->count();

            if ($clanZoneCount > 0) {
                // Euclidean distance check — 150 px covers all true Voronoi neighbors on a 1000x1000 map with ~200 zones
                $radiusSq = 150 * 150;
                $hasAdjacent = MapZone::where('clan_id', $clan->id)
                    ->whereRaw(
                        '((x_coord - ?) * (x_coord - ?) + (y_coord - ?) * (y_coord - ?)) <= ?',
                        [$zone->x_coord, $zone->x_coord, $zone->y_coord, $zone->y_coord, $radiusSq]
                    )
                    ->exists();

                if (!$hasAdjacent) {
                    $error = "Ce territoire n'est pas limitrophe à votre royaume. Vous ne pouvez conquérir que des zones adjacentes à vos terres actuelles.";
                    return;
                }
            }

            DB::table('clans')->where('id', $clan->id)->decrement('crystals_pool', $cost);

            // Start the conquest timer instead of immediately claiming
            $zone->conquering_clan_id  = $clan->id;
            $zone->conquest_started_at = now();
            $zone->is_capital          = false;

            // If it's the clan's first zone ever (no zones at all), conquer instantly as capital
            $totalClanZones = MapZone::where('clan_id', $clan->id)->count();
            if ($totalClanZones === 0) {
                $zone->clan_id             = $clan->id;
                $zone->conquering_clan_id  = null;
                $zone->conquest_started_at = null;
                $zone->is_capital          = true;
            }

            $zone->save();
        });

        if ($error) {
            return back()->withErrors(['message' => $error]);
        }

        $duration = self::TERRAIN_DURATIONS[$zone->type] ?? 10;
        $clanHasZones = MapZone::where('clan_id', $user->clan_id)->count() > 0;

        // Recalcul immédiat uniquement si c'était la capitale (conquête instantanée)
        if (!$clanHasZones) {
            \App\Models\Clan::find($user->clan_id)?->recalculate();
            return back()->with('message', "« {$zone->name} » est votre Capitale ! Le clan est désormais sur la carte. 👑");
        }

        return back()->with('message', "Conquête de « {$zone->name} » lancée ! Elle sera à vous dans {$duration} minutes. ⏳");
    }

    public function rename(Request $request, MapZone $zone)
    {
        $request->validate(['name' => 'required|string|max:50']);

        $user = $request->user();

        if ($zone->clan_id !== $user->clan_id) {
            return back()->withErrors(['message' => "Vous ne possédez pas ce territoire."]);
        }

        if ($user->clan_rank !== 'leader' && $user->clan_rank !== 'officer') {
            return back()->withErrors(['message' => "Seuls le chef ou les officiers peuvent renommer une terre."]);
        }

        $zone->name = $request->name;
        $zone->save();

        return back()->with('message', 'Territoire renommé avec succès.');
    }

    public function setCapital(Request $request, MapZone $zone)
    {
        $user = $request->user();

        if ($zone->clan_id !== $user->clan_id) {
            return back()->withErrors(['message' => "Vous ne contrôlez pas ce territoire."]);
        }

        if ($user->clan_rank !== 'leader' && $user->clan_rank !== 'officer') {
            return back()->withErrors(['message' => "Seuls le chef ou les officiers peuvent choisir la Capitale."]);
        }

        // Remove old capital
        MapZone::where('clan_id', $user->clan_id)->update(['is_capital' => false]);

        $zone->is_capital = true;
        $zone->save();

        return back()->with('message', "« {$zone->name} » est désormais votre Capitale ! 👑");
    }

    public function declareWar(Request $request, MapZone $zone)
    {
        $user = $request->user();

        if (!$user->clan_id) {
            return back()->withErrors(['message' => "Vous devez être dans un clan pour déclarer la guerre."]);
        }

        if ($user->clan_rank !== 'leader' && $user->clan_rank !== 'officer') {
            return back()->withErrors(['message' => "Seuls le chef ou les officiers peuvent déclarer la guerre."]);
        }

        if (!$zone->clan_id) {
            return back()->withErrors(['message' => "Cette zone n'appartient à aucun clan."]);
        }

        if ($zone->clan_id === $user->clan_id) {
            return back()->withErrors(['message' => "Vous ne pouvez pas vous déclarer la guerre à vous-même."]);
        }

        $enemyClanId = $zone->clan_id;

        // Vérifier qu'aucune guerre active n'existe déjà entre ces deux clans
        $existing = War::whereIn('status', ['pending', 'active'])
            ->where(fn($q) => $q
                ->where(fn($q2) => $q2->where('clan_a_id', $user->clan_id)->where('clan_b_id', $enemyClanId))
                ->orWhere(fn($q2) => $q2->where('clan_a_id', $enemyClanId)->where('clan_b_id', $user->clan_id))
            )->first();

        if ($existing) {
            return redirect()->route('wars.show', $existing->id)
                ->with('message', "Une guerre est déjà en cours contre ce clan !");
        }

        $war = War::create([
            'clan_a_id'    => $user->clan_id,
            'clan_b_id'    => $enemyClanId,
            'scheduled_at' => now(),
            'status'       => 'pending',
            'zone_id'      => $zone->id,
        ]);

        app(WarService::class)->startWar($war);

        return redirect()->route('wars.show', $war->id)
            ->with('message', "Guerre déclarée pour la zone « {$zone->name} » ! Déployez vos troupes.");
    }
}
