<?php

namespace App\Http\Controllers;

use App\Models\Clan;
use App\Models\LegendaryWar;
use App\Models\LegendaryWarAction;
use App\Models\LegendaryWarClan;
use App\Models\LegendaryWarRound;
use App\Models\SoldierType;
use App\Models\UserTroop;
use App\Services\LegendaryWarService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class LegendaryWarController extends Controller
{
    public function show(LegendaryWar $legendaryWar)
    {
        $user = auth()->user();

        $participants = LegendaryWarClan::where('legendary_war_id', $legendaryWar->id)
            ->with('clan')
            ->get();

        $myClan = $participants->firstWhere('clan_id', $user->clan_id);
        if (!$myClan) {
            abort(403, 'Vous ne participez pas à cette bataille légendaire.');
        }

        $rounds = LegendaryWarRound::where('legendary_war_id', $legendaryWar->id)
            ->orderBy('round_number')
            ->with('actions.user:id,username')
            ->get();

        $activeRound = $rounds->firstWhere('status', 'active');

        $userActionThisRound = $activeRound
            ? LegendaryWarAction::where('legendary_war_round_id', $activeRound->id)
                ->where('user_id', $user->id)
                ->first()
            : null;

        $soldierTypes = SoldierType::all()->keyBy('id');

        $myTroops = UserTroop::where('user_id', $user->id)
            ->where('quantity', '>', 0)
            ->with('soldierType')
            ->get()
            ->mapWithKeys(fn($t) => [(string) $t->soldier_type_id => $t->quantity]);

        return Inertia::render('LegendaryWarView', [
            'war'                 => $legendaryWar,
            'participants'        => $participants->values(),
            'rounds'              => $rounds->values(),
            'activeRound'         => $activeRound,
            'userActionThisRound' => $userActionThisRound,
            'myTroops'            => $myTroops,
            'soldierTypes'        => $soldierTypes->values(),
            'myClanId'            => $user->clan_id,
        ]);
    }

    public function submitAction(Request $request, LegendaryWar $legendaryWar)
    {
        $request->validate([
            'tactic'   => 'required|in:frontal_attack,echelon_defense,targeted_strike,tactical_retreat,final_push',
            'troops'   => 'required|array',
            'troops.*' => 'integer|min:0',
        ]);

        $user = auth()->user();

        $participant = LegendaryWarClan::where('legendary_war_id', $legendaryWar->id)
            ->where('clan_id', $user->clan_id)
            ->first();

        if (!$participant) {
            return back()->withErrors(['message' => 'Vous ne participez pas à cette bataille légendaire.']);
        }

        if ($participant->eliminated_round !== null) {
            return back()->withErrors(['message' => 'Votre clan a été éliminé.']);
        }

        if ($legendaryWar->status !== 'active') {
            return back()->withErrors(['message' => 'Cette bataille n\'est pas active.']);
        }

        $activeRound = LegendaryWarRound::where('legendary_war_id', $legendaryWar->id)
            ->where('round_number', $legendaryWar->current_round)
            ->where('status', 'active')
            ->first();

        if (!$activeRound) {
            return back()->withErrors(['message' => 'Aucun round actif.']);
        }

        if (LegendaryWarAction::where('legendary_war_round_id', $activeRound->id)->where('user_id', $user->id)->exists()) {
            return back()->withErrors(['message' => 'Vous avez déjà soumis une action pour ce round.']);
        }

        $myTroops = UserTroop::where('user_id', $user->id)->get()->keyBy('soldier_type_id');

        $committed = [];
        $total     = 0;

        foreach ($request->troops as $typeId => $qty) {
            $qty = (int) $qty;
            if ($qty <= 0) continue;
            $available = $myTroops[(string) $typeId]?->quantity ?? 0;
            if ($qty > $available) {
                return back()->withErrors(['message' => 'Pas assez de troupes disponibles.']);
            }
            $committed[(string) $typeId] = $qty;
            $total += $qty;
        }

        if ($total === 0 && $request->tactic !== 'tactical_retreat') {
            return back()->withErrors(['message' => 'Engagez au moins une troupe, ou choisissez le Repli tactique.']);
        }

        \DB::transaction(function () use ($legendaryWar, $activeRound, $user, $committed, $myTroops) {
            // Déduire les troupes engagées de l'inventaire
            foreach ($committed as $typeId => $qty) {
                $troop = $myTroops[(string) $typeId] ?? null;
                if ($troop) {
                    $troop->quantity -= $qty;
                    $troop->save();
                }
            }

            LegendaryWarAction::create([
                'legendary_war_id'       => $legendaryWar->id,
                'legendary_war_round_id' => $activeRound->id,
                'user_id'                => $user->id,
                'clan_id'                => $user->clan_id,
                'tactic'                 => $request->tactic,
                'troops'                 => $committed,
            ]);
        });

        return back()->with('message', 'Action soumise pour le round ' . $activeRound->round_number . ' !');
    }
}
