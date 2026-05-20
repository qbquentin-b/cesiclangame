<?php

namespace App\Http\Controllers;

use App\Models\SoldierType;
use App\Models\War;
use App\Models\WarDeployment;
use App\Models\WarRound;
use App\Models\WarRoundAction;
use App\Services\WarService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WarController extends Controller
{
    public function show(War $war)
    {
        $user = auth()->user();

        if ($user->clan_id !== $war->clan_a_id && $user->clan_id !== $war->clan_b_id) {
            abort(403, 'Vous ne participez pas à cette guerre.');
        }

        $war->load(['clanA', 'clanB']);

        $userClanId  = $user->clan_id;
        $enemyClanId = $userClanId === $war->clan_a_id ? $war->clan_b_id : $war->clan_a_id;
        $isA         = $userClanId === $war->clan_a_id;

        // Espionnage : Sun Tzu OU stratégie espionnage du clan
        $deployments = WarDeployment::where('war_id', $war->id)
            ->with(['user:id,username,clan_rank', 'commander'])
            ->get();

        $myStrategy    = $isA ? $war->strategy_a : $war->strategy_b;
        $theirStrategy = $isA ? $war->strategy_b : $war->strategy_a;

        $hasSpy = $deployments
            ->where('clan_id', $userClanId)
            ->contains(fn($d) => $d->commander?->effect_type === 'spy_and_debuff');

        // La stratégie "espionnage" révèle aussi les mouvements ennemis
        $canSeeEnemy = $hasSpy || $myStrategy === 'espionage';

        $myDeployments      = $deployments->where('clan_id', $userClanId)->values();
        $enemyDeployments   = $deployments->where('clan_id', $enemyClanId)->values()->map(function ($dep) use ($canSeeEnemy) {
            if (!$canSeeEnemy) {
                $dep        = clone $dep;
                $dep->troops = null;
            }
            return $dep;
        })->values();

        // Rounds
        $rounds = WarRound::where('war_id', $war->id)
            ->orderBy('round_number')
            ->with(['actions.user:id,username,clan_rank'])
            ->get();

        $activeRound = $rounds->firstWhere('status', 'active');

        $userActionThisRound = $activeRound
            ? WarRoundAction::where('war_round_id', $activeRound->id)
                ->where('user_id', $user->id)
                ->first()
            : null;

        $warService      = app(WarService::class);
        $hasDeployed     = WarDeployment::where('war_id', $war->id)->where('user_id', $user->id)->exists();
        $availableTroops = ($war->status === 'active' && $hasDeployed)
            ? $warService->availableTroops($war->id, $user->id)
            : [];

        // Scores totaux
        if ($rounds->isNotEmpty()) {
            $scoreA = $rounds->sum('score_a');
            $scoreB = $rounds->sum('score_b');
        } else {
            $scoreA = $deployments->where('clan_id', $war->clan_a_id)->sum('contribution_score');
            $scoreB = $deployments->where('clan_id', $war->clan_b_id)->sum('contribution_score');
        }

        // Préparer les rounds pour le frontend
        $processedRounds = $rounds->map(function ($round) use ($userClanId, $canSeeEnemy) {
            $roundFinished = $round->status === 'finished';

            $actions = $round->actions->map(function ($action) use ($userClanId, $canSeeEnemy, $roundFinished) {
                $isMine  = $action->clan_id === $userClanId;
                $visible = $isMine || $canSeeEnemy || $roundFinished;
                return [
                    'id'                 => $action->id,
                    'user_id'            => $action->user_id,
                    'clan_id'            => $action->clan_id,
                    'username'           => $action->user?->username,
                    'tactic'             => $visible ? $action->tactic : null,
                    'troops'             => $visible ? $action->troops : null,
                    'troops_lost'        => $roundFinished ? $action->troops_lost : null,
                    'contribution_score' => $action->contribution_score,
                ];
            });

            return [
                'id'           => $round->id,
                'round_number' => $round->round_number,
                'status'       => $round->status,
                'starts_at'    => $round->starts_at,
                'ends_at'      => $round->ends_at,
                'score_a'      => $round->score_a,
                'score_b'      => $round->score_b,
                'actions'      => $actions->values(),
            ];
        });

        $soldierTypes = SoldierType::all()->keyBy('id');

        // Napoléon disponible ?
        $canNapoleon = $war->status === 'active'
            && !$war->napoleon_bonus_used
            && in_array($user->clan_rank, ['leader', 'officer'])
            && $warService->clanHasCommander($war, $userClanId, 'infantry_boost');

        return Inertia::render('WarDetail', [
            'war'                 => $war,
            'rounds'              => $processedRounds->values(),
            'activeRound'         => $activeRound,
            'userActionThisRound' => $userActionThisRound,
            'availableTroops'     => $availableTroops,
            'hasDeployed'         => $hasDeployed,
            'myDeployments'       => $myDeployments,
            'enemyDeployments'    => $enemyDeployments,
            'soldierTypes'        => $soldierTypes->values(),
            'scoreA'              => $scoreA,
            'scoreB'              => $scoreB,
            'hasSpy'              => $hasSpy,
            'canSeeEnemy'         => $canSeeEnemy,
            'isA'                 => $isA,
            'tactics'             => WarService::TACTICS,
            'myStrategy'          => $myStrategy,
            'theirStrategy'       => $theirStrategy,
            'canSetStrategy'      => in_array($user->clan_rank, ['leader', 'officer']) && $war->status === 'active',
            'canNapoleon'         => $canNapoleon,
            'userClanRank'        => $user->clan_rank,
            'moraleA'             => $war->morale_a ?? 100,
            'moraleB'             => $war->morale_b ?? 100,
        ]);
    }

    public function submitAction(Request $request, War $war)
    {
        $request->validate([
            'tactic'   => 'required|in:frontal_attack,echelon_defense,targeted_strike,tactical_retreat,final_push',
            'troops'   => 'required|array',
            'troops.*' => 'integer|min:0',
        ]);

        $user = auth()->user();

        if ($user->clan_id !== $war->clan_a_id && $user->clan_id !== $war->clan_b_id) {
            return back()->withErrors(['message' => 'Vous ne participez pas à cette guerre.']);
        }

        if ($war->status !== 'active') {
            return back()->withErrors(['message' => 'Cette guerre n\'est pas active.']);
        }

        $activeRound = WarRound::where('war_id', $war->id)
            ->where('round_number', $war->current_round)
            ->where('status', 'active')
            ->first();

        if (!$activeRound) {
            return back()->withErrors(['message' => 'Aucun round actif pour cette guerre.']);
        }

        if (WarRoundAction::where('war_round_id', $activeRound->id)->where('user_id', $user->id)->exists()) {
            return back()->withErrors(['message' => 'Vous avez déjà soumis une action pour ce round.']);
        }

        $hasDeployed = WarDeployment::where('war_id', $war->id)->where('user_id', $user->id)->exists();
        if (!$hasDeployed) {
            return back()->withErrors(['message' => 'Déployez d\'abord vos troupes dans cette guerre.']);
        }

        $warService = app(WarService::class);
        $available  = $warService->availableTroops($war->id, $user->id);

        $committed = [];
        $total     = 0;

        foreach ($request->troops as $typeId => $qty) {
            $qty = (int) $qty;
            if ($qty <= 0) continue;
            if ($qty > ($available[(string) $typeId] ?? 0)) {
                return back()->withErrors(['message' => 'Pas assez de troupes disponibles.']);
            }
            $committed[(string) $typeId] = $qty;
            $total += $qty;
        }

        if ($total === 0 && $request->tactic !== 'tactical_retreat') {
            return back()->withErrors(['message' => 'Engagez au moins une troupe, ou choisissez le Repli tactique.']);
        }

        WarRoundAction::create([
            'war_id'       => $war->id,
            'war_round_id' => $activeRound->id,
            'user_id'      => $user->id,
            'clan_id'      => $user->clan_id,
            'tactic'       => $request->tactic,
            'troops'       => $committed,
        ]);

        return back()->with('message', 'Action soumise pour le round ' . $activeRound->round_number . ' !');
    }

    public function setStrategy(Request $request, War $war)
    {
        $request->validate([
            'strategy' => 'required|in:assault,defense,espionage,pillage',
        ]);

        $user = auth()->user();

        if (!in_array($user->clan_rank, ['leader', 'officer'])) {
            return back()->withErrors(['message' => 'Seuls le chef et les officiers peuvent définir la stratégie.']);
        }

        if ($user->clan_id !== $war->clan_a_id && $user->clan_id !== $war->clan_b_id) {
            return back()->withErrors(['message' => 'Vous ne participez pas à cette guerre.']);
        }

        if ($war->status !== 'active') {
            return back()->withErrors(['message' => 'La guerre n\'est pas active.']);
        }

        app(WarService::class)->setStrategy($war, $user->clan_id, $request->strategy);

        return back()->with('message', 'Stratégie définie : ' . $request->strategy);
    }

    public function napoleonBonus(Request $request, War $war)
    {
        $user = auth()->user();

        if (!in_array($user->clan_rank, ['leader', 'officer'])) {
            return back()->withErrors(['message' => 'Seuls le chef et les officiers peuvent déclencher la Dernière Charge.']);
        }

        if ($user->clan_id !== $war->clan_a_id && $user->clan_id !== $war->clan_b_id) {
            return back()->withErrors(['message' => 'Vous ne participez pas à cette guerre.']);
        }

        $success = app(WarService::class)->triggerNapoleonBonus($war, $user->clan_id);

        if (!$success) {
            return back()->withErrors(['message' => 'Impossible de déclencher la Dernière Charge (déjà utilisé, score pas en déficit, ou moins de 2 rounds écoulés).']);
        }

        return back()->with('message', 'Napoléon déclenche la Dernière Charge ! Un round supplémentaire a été ajouté.');
    }
}
