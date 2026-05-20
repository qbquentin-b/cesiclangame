<?php

namespace App\Http\Controllers;

use App\Models\MapZone;
use App\Models\ZoneBuilding;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ZoneBuildingController extends Controller
{
    public function store(Request $request, MapZone $zone)
    {
        $request->validate(['type' => 'required|string|in:' . implode(',', array_keys(ZoneBuilding::TYPES))]);

        $user = $request->user();

        if ($zone->clan_id !== $user->clan_id) {
            return back()->withErrors(['message' => "Vous ne contrôlez pas cette zone."]);
        }

        if ($zone->zoneBuildings()->count() >= ZoneBuilding::MAX_SLOTS) {
            return back()->withErrors(['message' => "Cette zone ne peut accueillir que " . ZoneBuilding::MAX_SLOTS . " bâtiments."]);
        }

        // One building of same type per zone
        if ($zone->zoneBuildings()->where('type', $request->type)->exists()) {
            return back()->withErrors(['message' => "Ce type de bâtiment est déjà présent dans cette zone."]);
        }

        $config  = ZoneBuilding::TYPES[$request->type];
        [$wood, $metal, $food, $gold] = $config['cost'];

        $error = null;

        DB::transaction(function () use ($user, $zone, $request, $wood, $metal, $food, $gold, &$error) {
            $u = User::where('id', $user->id)->lockForUpdate()->first();

            if ($u->wood < $wood || $u->metal < $metal || $u->food < $food || $u->gold < $gold) {
                $error = "Ressources insuffisantes pour construire ce bâtiment.";
                return;
            }

            $u->wood  -= $wood;
            $u->metal -= $metal;
            $u->food  -= $food;
            $u->gold  -= $gold;
            $u->save();

            ZoneBuilding::create([
                'zone_id' => $zone->id,
                'clan_id' => $user->clan_id,
                'type'    => $request->type,
                'level'   => 1,
            ]);
        });

        if ($error) return back()->withErrors(['message' => $error]);

        $label = ZoneBuilding::TYPES[$request->type]['label'] ?? $request->type;
        return back()->with('message', "{$label} construit avec succès !");
    }

    public function upgrade(Request $request, ZoneBuilding $building)
    {
        $user = $request->user();

        if ($building->clan_id !== $user->clan_id) {
            return back()->withErrors(['message' => "Ce bâtiment n'appartient pas à votre clan."]);
        }

        if ($building->level >= ZoneBuilding::MAX_LEVEL) {
            return back()->withErrors(['message' => "Ce bâtiment est déjà au niveau maximum."]);
        }

        $cost = $building->getUpgradeCost();
        if (!$cost) return back()->withErrors(['message' => "Niveau maximum atteint."]);

        [$wood, $metal, $food, $gold] = $cost;

        $error = null;

        DB::transaction(function () use ($user, $building, $wood, $metal, $food, $gold, &$error) {
            $u = User::where('id', $user->id)->lockForUpdate()->first();

            if ($u->wood < $wood || $u->metal < $metal || $u->food < $food || $u->gold < $gold) {
                $error = "Ressources insuffisantes pour améliorer ce bâtiment.";
                return;
            }

            $u->wood  -= $wood;
            $u->metal -= $metal;
            $u->food  -= $food;
            $u->gold  -= $gold;
            $u->save();

            $building->level++;
            $building->save();
        });

        if ($error) return back()->withErrors(['message' => $error]);
        return back()->with('message', "{$building->getLabel()} amélioré au niveau {$building->level} !");
    }

    public function destroy(ZoneBuilding $building, Request $request)
    {
        $user = $request->user();

        if ($building->clan_id !== $user->clan_id) {
            return back()->withErrors(['message' => "Ce bâtiment n'appartient pas à votre clan."]);
        }

        $label = $building->getLabel();
        $building->delete();
        return back()->with('message', "{$label} démoli.");
    }
}
