<?php

namespace App\Http\Controllers;

use App\Models\Clan;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RankingController extends Controller
{
    public function index()
    {
        $topClans = Clan::orderBy('power_score', 'desc')
            ->orderBy('crystals_pool', 'desc')
            ->take(50)
            ->get();
            
        $topPlayers = User::with('clan:id,name')
            ->orderBy('crystals', 'desc')
            ->orderBy('war_points', 'desc')
            ->take(50)
            ->get();

        return Inertia::render('RankingsView', [
            'topClans' => $topClans,
            'topPlayers' => $topPlayers,
        ]);
    }
}
