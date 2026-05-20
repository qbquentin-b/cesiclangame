<?php

namespace App\Http\Controllers;

use App\Models\Chest;
use App\Models\DailyGameCompletion;
use App\Services\DailyPuzzles;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class DailyGameController extends Controller
{
    const GAME_TYPES = ['queens', 'tango', 'zip', 'patches'];

    public function index()
    {
        $user  = auth()->user();
        $today = Carbon::today();

        $completions = DailyGameCompletion::where('user_id', $user->id)
            ->whereDate('game_date', $today->toDateString())
            ->get()
            ->keyBy('game_type');

        $games = [];
        foreach (self::GAME_TYPES as $type) {
            $comp = $completions->get($type);
            $games[$type] = [
                'puzzle'           => DailyPuzzles::getForDate($type, $today),
                'completed'        => (bool) $comp,
                'rank'             => $comp?->rank,
                'duration_seconds' => $comp?->duration_seconds,
            ];
        }

        $leaderboard = [];
        foreach (self::GAME_TYPES as $type) {
            $leaderboard[$type] = DailyGameCompletion::with('user:id,username')
                ->where('game_type', $type)
                ->whereDate('game_date', $today->toDateString())
                ->orderByRaw('duration_seconds IS NULL ASC')
                ->orderBy('duration_seconds')
                ->orderBy('completed_at')
                ->take(10)
                ->get()
                ->map(fn($c) => [
                    'name'             => $c->user?->username ?? '?',
                    'rank'             => $c->rank,
                    'duration_seconds' => $c->duration_seconds,
                    'chest_awarded'    => $c->chest_awarded,
                ]);
        }

        return Inertia::render('DailyGamesView', compact('games', 'leaderboard'));
    }

    public function complete(Request $request, string $type)
    {
        if (!in_array($type, self::GAME_TYPES)) {
            return back()->withErrors(['message' => 'Jeu inconnu.']);
        }

        $request->validate([
            'solution'         => 'required',
            'duration_seconds' => 'nullable|integer|min:1|max:7200',
        ]);

        $user  = auth()->user();
        $today = Carbon::today();

        if (DailyGameCompletion::where('user_id', $user->id)
            ->where('game_type', $type)
            ->whereDate('game_date', $today->toDateString())
            ->exists()
        ) {
            return back()->withErrors(['message' => 'Déjà complété aujourd\'hui.']);
        }

        if (!DailyPuzzles::validateSolution($type, $today, $request->input('solution'))) {
            return back()->withErrors(['message' => 'Solution incorrecte.']);
        }

        // Rang provisoire (sera recalculé à 9h demain)
        $rank = DailyGameCompletion::where('game_type', $type)
            ->whereDate('game_date', $today->toDateString())
            ->count() + 1;

        DailyGameCompletion::create([
            'user_id'          => $user->id,
            'game_type'        => $type,
            'game_date'        => $today->toDateString(),
            'completed_at'     => now(),
            'duration_seconds' => $request->input('duration_seconds'),
            'rank'             => $rank,
            'chest_awarded'    => false,
        ]);

        return back()->with('flash', [
            'dailyGame' => [
                'rank'    => $rank,
                'pending' => true, // coffre attribué demain à 9h
            ],
        ]);
    }
}
