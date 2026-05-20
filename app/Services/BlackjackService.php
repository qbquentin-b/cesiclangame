<?php

namespace App\Services;

class BlackjackService
{
    public static function createDeck(int $numDecks = 6): array
    {
        $suits = ['♠', '♥', '♦', '♣'];
        $ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        $deck  = [];

        for ($d = 0; $d < $numDecks; $d++) {
            foreach ($suits as $suit) {
                foreach ($ranks as $rank) {
                    $deck[] = [
                        'suit'  => $suit,
                        'rank'  => $rank,
                        'value' => self::rankValue($rank),
                    ];
                }
            }
        }

        shuffle($deck);
        return $deck;
    }

    public static function rankValue(string $rank): int
    {
        if ($rank === 'A') return 11;
        if (in_array($rank, ['J', 'Q', 'K'])) return 10;
        return (int) $rank;
    }

    public static function handTotal(array $hand): int
    {
        $total = 0;
        $aces  = 0;

        foreach ($hand as $card) {
            $total += $card['value'];
            if ($card['rank'] === 'A') $aces++;
        }

        while ($total > 21 && $aces > 0) {
            $total -= 10;
            $aces--;
        }

        return $total;
    }

    public static function isBlackjack(array $hand): bool
    {
        return count($hand) === 2 && self::handTotal($hand) === 21;
    }

    public static function isBust(array $hand): bool
    {
        return self::handTotal($hand) > 21;
    }

    public static function dealCard(array &$deck): array
    {
        return array_pop($deck);
    }
}
