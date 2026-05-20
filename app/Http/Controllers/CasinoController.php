<?php

namespace App\Http\Controllers;

use App\Models\BlackjackPlayer;
use App\Models\CasinoJackpot;
use Inertia\Inertia;

class CasinoController extends Controller
{
    public function index()
    {
        $jackpot = CasinoJackpot::first();
        $user    = auth()->user();

        // Table active de l'user (si elle existe)
        $myTablePlayer = BlackjackPlayer::where('user_id', $user->id)
            ->whereHas('blackjackTable', fn($q) => $q->whereIn('status', ['waiting', 'betting', 'playing', 'dealer_turn']))
            ->first();

        $myTable = $myTablePlayer?->table_id;

        return Inertia::render('CasinoView', [
            'jackpot'     => $jackpot ? $jackpot->amount : 1000,
            'free_spins'  => $user->slot_free_spins ?? 0,
            'crystals'    => $user->crystals,
            'my_table_id' => $myTable,
        ]);
    }
}
