<?php

namespace App\Http\Controllers;

use App\Models\Bet;
use App\Models\Mission;
use App\Models\BettingEvent;
use App\Models\Quiz;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GameController extends Controller
{
    public function index()
    {
        $user          = auth()->user();
        $bettingEvents = BettingEvent::where('status', 'open')->get();
        $userBets      = Bet::where('user_id', $user->id)->pluck('event_id')->toArray();

        $clanMissions = $user->clan_id
            ? Mission::where('clan_id', $user->clan_id)
                ->whereIn('status', ['open', 'submitted'])
                ->get()
            : collect();

        $activeQuizzes = Quiz::where('status', 'active')->latest()->get();

        return Inertia::render('GamesView', [
            'bettingEvents' => $bettingEvents,
            'userBets'      => $userBets,
            'clanMissions'  => $clanMissions,
            'activeQuizzes' => $activeQuizzes,
        ]);
    }

    public function getQuizQuestions(Quiz $quiz)
    {
        if ($quiz->status !== 'active') {
            return response()->json(['error' => 'Quiz non disponible.'], 403);
        }
        return response()->json([
            'id'                 => $quiz->id,
            'title'              => $quiz->title,
            'reward_per_correct' => $quiz->reward_per_correct,
            'questions'          => $quiz->parseQuestions(),
        ]);
    }

    public function completeQuiz(Request $request)
    {
        $request->validate([
            'correct'            => 'required|integer|min:0',
            'reward_per_correct' => 'required|integer|min:1|max:100',
            'total'              => 'required|integer|min:1',
        ]);

        $correct = min($request->correct, $request->total);
        $reward  = $correct * $request->reward_per_correct;

        if ($reward > 0) {
            $user = $request->user();
            $user->crystals += $reward;
            $user->save();
        }

        return back()->with('quizReward', $reward);
    }

    public function placeBet(Request $request)
    {
        $request->validate([
            'event_id' => 'required|string',
            'amount' => 'required|integer|min:1',
            'prediction' => 'required|string',
        ]);

        $user = $request->user();

        if ($user->crystals < $request->amount) {
            return back()->withErrors(['message' => 'Not enough crystals']);
        }

        $user->crystals -= $request->amount;
        $user->save();

        Bet::create([
            'user_id' => $user->id,
            'event_id' => $request->event_id,
            'amount' => $request->amount,
            'prediction' => $request->prediction,
            'status' => 'pending',
        ]);

        return back()->with('message', 'Bet placed');
    }

    public function submitMission(Request $request, Mission $mission)
    {
        $request->validate([
            'proof_url' => 'required|url',
        ]);

        if ($mission->clan_id !== $request->user()->clan_id) {
            return abort(403);
        }

        $mission->status = 'submitted';
        $mission->proof_url = $request->proof_url;
        $mission->save();

        return back()->with('message', 'Mission submitted for validation');
    }
}
