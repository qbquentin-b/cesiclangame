<?php

namespace App\Http\Controllers;

use App\Models\Chest;
use App\Models\Clan;
use App\Models\Commander;
use App\Models\Drop;
use App\Models\Quiz;
use App\Models\User;
use App\Models\War;
use App\Models\WarDeployment;
use App\Models\Mission;
use App\Models\BettingEvent;
use App\Models\LegendaryWar;
use App\Models\LegendaryWarClan;
use App\Services\LegendaryWarService;
use App\Services\WarService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AdminController extends Controller
{
    public function index()
    {
        return Inertia::render('AdminPanel', [
            'users'   => User::with('clan:id,name,color')->orderBy('username')->get(),
            'clans'   => Clan::withCount('members')->orderBy('name')->get(),
            'events'  => BettingEvent::latest()->get(),
            'wars'    => War::with(['clanA:id,name', 'clanB:id,name'])->latest()->take(20)->get(),
            'quizzes' => Quiz::latest()->get(),
        ]);
    }

    // ── Quizzes ───────────────────────────────────────────────────────────────

    public function storeQuiz(Request $request)
    {
        $request->validate([
            'title'              => 'required|string|max:255',
            'content'            => 'required|string',
            'reward_per_correct' => 'integer|min:1|max:100',
        ]);

        Quiz::create([
            'title'              => $request->title,
            'content'            => $request->content,
            'reward_per_correct' => $request->reward_per_correct ?? 10,
            'status'             => 'active',
        ]);

        return back()->with('message', 'Quiz créé !');
    }

    public function destroyQuiz(Quiz $quiz)
    {
        $quiz->delete();
        return back()->with('message', 'Quiz supprimé.');
    }

    public function archiveQuiz(Quiz $quiz)
    {
        $quiz->status = $quiz->status === 'active' ? 'archived' : 'active';
        $quiz->save();
        return back()->with('message', $quiz->status === 'active' ? 'Quiz activé.' : 'Quiz archivé.');
    }

    // ── Coffres ───────────────────────────────────────────────────────────────

    public function giveChest(Request $request)
    {
        $request->validate([
            'user_id'    => 'required|exists:users,id',
            'chest_type' => 'required|in:common,rare,legendary',
        ]);

        Chest::create([
            'user_id'     => $request->user_id,
            'chest_type'  => $request->chest_type,
            'status'      => 'unopened',
            'source'      => 'admin',
            'obtained_at' => now(),
        ]);

        return back()->with('message', 'Coffre offert au joueur !');
    }

    // ── Drops ────────────────────────────────────────────────────────────────

    public function createDrop(Request $request)
    {
        $request->validate([
            'title'      => 'required|string|max:255',
            'type'       => 'required|in:crystals,resource,weapon_plan,boost,commander',
            'value'      => 'required|integer|min:1',
            'max_claims' => 'required|integer|min:1',
            'expires_in' => 'nullable|integer|min:1',
        ]);

        Drop::create([
            'title'      => $request->title,
            'type'       => $request->type,
            'value'      => $request->value,
            'max_claims' => $request->max_claims,
            'expires_at' => $request->expires_in ? now()->addMinutes($request->expires_in) : now()->addHours(24),
        ]);

        return back()->with('message', 'Drop créé !');
    }

    public function createFlashDrop(Request $request)
    {
        $request->validate([
            'title'      => 'required|string|max:255',
            'type'       => 'required|in:crystals,resource,weapon_plan,boost,commander',
            'value'      => 'required|integer|min:1',
            'max_claims' => 'required|integer|min:1',
        ]);

        Drop::create([
            'title'      => '[FLASH] ' . $request->title,
            'type'       => $request->type,
            'value'      => $request->value,
            'max_claims' => $request->max_claims,
            'expires_at' => now()->addMinutes(5),
        ]);

        return back()->with('message', 'Drop flash de 5 minutes créé !');
    }

    // ── Players ───────────────────────────────────────────────────────────────

    public function creditPlayer(Request $request)
    {
        $request->validate([
            'user_id'   => 'required|exists:users,id',
            'resource'  => 'required|in:crystals,war_points,wood,metal,food,gold',
            'amount'    => 'required|integer|min:1',
        ]);

        $user = User::findOrFail($request->user_id);
        $user->increment($request->resource, $request->amount);

        return back()->with('message', "+{$request->amount} {$request->resource} crédités à {$user->username}");
    }

    public function kickPlayer(Request $request)
    {
        $request->validate(['user_id' => 'required|exists:users,id']);

        $target = User::findOrFail($request->user_id);

        if (!$target->clan_id) {
            return back()->withErrors(['message' => "Ce joueur n'est dans aucun clan."]);
        }

        $target->clan_id   = null;
        $target->clan_rank = null;
        $target->save();

        return back()->with('message', "{$target->username} expulsé de son clan.");
    }

    public function resetPlayer(Request $request)
    {
        $request->validate(['user_id' => 'required|exists:users,id']);

        $user = User::findOrFail($request->user_id);
        $user->update([
            'crystals'   => 0,
            'war_points' => 0,
            'wood'       => 0,
            'metal'      => 0,
            'food'       => 0,
            'gold'       => 0,
        ]);

        return back()->with('message', "Ressources de {$user->username} remises à zéro.");
    }

    // ── Clans ─────────────────────────────────────────────────────────────────

    public function creditClan(Request $request)
    {
        $request->validate([
            'clan_id' => 'required|exists:clans,id',
            'amount'  => 'required|integer|min:1',
        ]);

        $clan = Clan::findOrFail($request->clan_id);
        $clan->increment('crystals_pool', $request->amount);

        return back()->with('message', "+{$request->amount} cristaux crédités à la trésorerie de {$clan->name}.");
    }

    public function dissolveClan(Request $request)
    {
        $request->validate(['clan_id' => 'required|exists:clans,id']);

        DB::transaction(function () use ($request) {
            User::where('clan_id', $request->clan_id)->update(['clan_id' => null, 'clan_rank' => null]);
            Clan::destroy($request->clan_id);
        });

        return back()->with('message', 'Clan dissous.');
    }

    // ── Wars ──────────────────────────────────────────────────────────────────

    public function triggerWar(Request $request)
    {
        $request->validate([
            'clan_a_id' => 'required|exists:clans,id|different:clan_b_id',
            'clan_b_id' => 'required|exists:clans,id',
        ]);

        $war = War::create([
            'clan_a_id'    => $request->clan_a_id,
            'clan_b_id'    => $request->clan_b_id,
            'scheduled_at' => now(),
            'status'       => 'pending',
        ]);

        app(WarService::class)->startWar($war);

        return back()->with('message', 'Guerre déclenchée !');
    }

    public function triggerBlitzWar(Request $request)
    {
        $request->validate([
            'clan_a_id' => 'required|exists:clans,id|different:clan_b_id',
            'clan_b_id' => 'required|exists:clans,id',
        ]);

        $clanA = Clan::findOrFail($request->clan_a_id);
        $clanB = Clan::findOrFail($request->clan_b_id);

        $winnerId = $clanA->power_score > $clanB->power_score ? $clanA->id
                  : ($clanB->power_score > $clanA->power_score ? $clanB->id : null);

        War::create([
            'clan_a_id'    => $clanA->id,
            'clan_b_id'    => $clanB->id,
            'scheduled_at' => now(),
            'status'       => 'finished',
            'score_a'      => $clanA->power_score,
            'score_b'      => $clanB->power_score,
            'winner_id'    => $winnerId,
        ]);

        if ($winnerId) {
            Clan::where('id', $winnerId)->increment('crystals_pool', 500);
        }

        return back()->with('message', 'Guerre éclair résolue !');
    }

    public function resolveWar(Request $request, War $war)
    {
        $request->validate([
            'winner_id' => 'nullable|in:' . $war->clan_a_id . ',' . $war->clan_b_id,
            'score_a'   => 'nullable|integer|min:0',
            'score_b'   => 'nullable|integer|min:0',
        ]);

        $service = new WarService();

        if ($request->score_a !== null) {
            $service->resolve($war, $request->score_a, $request->score_b ?? 0, $request->winner_id ?: null);
        } else {
            $service->resolve($war);
        }

        return back()->with('message', 'Guerre résolue avec calcul des déploiements !');
    }

    public function triggerLegendaryWar(Request $request)
    {
        $request->validate([
            'clan_ids'   => 'required|array|min:3|max:6',
            'clan_ids.*' => 'exists:clans,id',
        ]);

        $clanIds = array_unique($request->clan_ids);
        if (count($clanIds) < 3) {
            return back()->withErrors(['message' => 'Une bataille légendaire nécessite au moins 3 clans distincts.']);
        }

        $war = LegendaryWar::create([
            'status'       => 'pending',
            'total_rounds' => 4,
            'scheduled_at' => now(),
        ]);

        foreach ($clanIds as $clanId) {
            LegendaryWarClan::create([
                'legendary_war_id' => $war->id,
                'clan_id'          => $clanId,
                'score'            => 0,
                'morale'           => 100,
            ]);
        }

        app(LegendaryWarService::class)->startWar($war);

        return back()->with('message', 'Bataille légendaire déclenchée avec ' . count($clanIds) . ' clans !');
    }

    // ── Events ────────────────────────────────────────────────────────────────

    public function storeEvent(Request $request)
    {
        $request->validate([
            'title'   => 'required|string|max:255',
            'options' => 'required|array|min:2',
        ]);

        BettingEvent::create(['title' => $request->title, 'options' => $request->options, 'status' => 'open']);

        return back()->with('message', 'Événement de pari créé.');
    }

    public function destroyEvent(BettingEvent $event)
    {
        $event->delete();
        return back()->with('message', 'Événement supprimé.');
    }

    public function validateMission(Request $request, Mission $mission)
    {
        $request->validate(['status' => 'required|in:validated,rejected']);

        $mission->status = $request->status;
        if ($request->status === 'validated') {
            $mission->clan->increment('crystals_pool', $mission->reward_crystals);
        }
        $mission->save();

        return back()->with('message', 'Mission mise à jour.');
    }
}
