<?php

namespace App\Http\Controllers;

use App\Models\CasinoJackpot;
use Illuminate\Http\Request;

class SlotController extends Controller
{
    const SYMBOLS = [
        ['id' => 'cristal',    'emoji' => '💎', 'weight' => 1],
        ['id' => 'couronne',   'emoji' => '👑', 'weight' => 2],
        ['id' => 'epee',       'emoji' => '⚔️', 'weight' => 4],
        ['id' => 'bouclier',   'emoji' => '🛡️', 'weight' => 7],
        ['id' => 'or',         'emoji' => '🪙', 'weight' => 10],
        ['id' => 'nourriture', 'emoji' => '🌾', 'weight' => 14],
        ['id' => 'feu',        'emoji' => '🔥', 'weight' => 3],
    ];

    const PAYOUTS = [
        'couronne'   => 30,
        'epee'       => 15,
        'bouclier'   => 8,
        'or'         => 4,
        'nourriture' => 3,
    ];

    public function spin(Request $request)
    {
        $request->validate(['bet' => 'required|integer|min:5|max:500']);

        $user   = auth()->user();
        $bet    = (int) $request->bet;
        $isFree = $user->slot_free_spins > 0;

        if (!$isFree && $user->crystals < $bet) {
            return response()->json(['error' => 'Pas assez de cristaux.'], 422);
        }

        if ($isFree) {
            $user->slot_free_spins -= 1;
        } else {
            $user->crystals -= $bet;
            $jackpot = CasinoJackpot::first();
            $jackpot->amount += (int) floor($bet * 0.02);
            $jackpot->save();
        }
        $user->save();

        // Spin 3 reels × 3 rows
        $reels = [];
        for ($r = 0; $r < 3; $r++) {
            $col = [];
            for ($row = 0; $row < 3; $row++) {
                $col[] = $this->rollSymbol();
            }
            $reels[] = $col;
        }

        // Center row payline (index 1)
        $center = [$reels[0][1]['id'], $reels[1][1]['id'], $reels[2][1]['id']];
        $win    = $this->calcWin($center, $bet, $user);

        $user->crystals += $win['amount'];
        $user->save();

        $jackpot = CasinoJackpot::first();

        return response()->json([
            'reels'      => $reels,
            'win'        => $win,
            'crystals'   => $user->crystals,
            'free_spins' => $user->slot_free_spins,
            'jackpot'    => $jackpot->amount,
        ]);
    }

    private function rollSymbol(): array
    {
        $total = array_sum(array_column(self::SYMBOLS, 'weight'));
        $roll  = rand(1, $total);
        $cum   = 0;

        foreach (self::SYMBOLS as $sym) {
            $cum += $sym['weight'];
            if ($roll <= $cum) return $sym;
        }

        return self::SYMBOLS[array_key_last(self::SYMBOLS)];
    }

    private function calcWin(array $center, int $bet, $user): array
    {
        // 3 fire = free spins scatter
        if ($center[0] === 'feu' && $center[1] === 'feu' && $center[2] === 'feu') {
            $user->slot_free_spins += 8;
            $user->save();
            return ['amount' => 0, 'type' => 'free_spins', 'free_spins' => 8];
        }

        // 3 identical
        if ($center[0] === $center[1] && $center[1] === $center[2]) {
            $sym = $center[0];

            if ($sym === 'cristal') {
                $jackpot         = CasinoJackpot::first();
                $amount          = $jackpot->amount;
                $jackpot->amount = 1000;
                $jackpot->save();
                return ['amount' => $amount, 'type' => 'jackpot'];
            }

            $mult = self::PAYOUTS[$sym] ?? 2;
            return ['amount' => $bet * $mult, 'type' => 'win', 'multiplier' => $mult];
        }

        // 2 identical — return full bet (break even)
        if ($center[0] === $center[1] || $center[1] === $center[2] || $center[0] === $center[2]) {
            return ['amount' => $bet, 'type' => 'small_win'];
        }

        return ['amount' => 0, 'type' => 'loss'];
    }
}
