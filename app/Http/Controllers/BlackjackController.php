<?php

namespace App\Http\Controllers;

use App\Models\BlackjackPlayer;
use App\Models\BlackjackTable;
use App\Services\BlackjackService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BlackjackController extends Controller
{
    // GET /casino/blackjack/tables
    public function tables(): JsonResponse
    {
        $tables = BlackjackTable::with(['players.user:id,username'])
            ->whereIn('status', ['waiting', 'betting', 'playing', 'dealer_turn'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($t) => $this->formatTableSummary($t));

        return response()->json($tables);
    }

    // POST /casino/blackjack/create
    public function create(Request $request): JsonResponse
    {
        $user = auth()->user();

        // Check user not already at a table
        $existing = BlackjackPlayer::where('user_id', $user->id)
            ->whereHas('blackjackTable', fn($q) => $q->whereIn('status', ['waiting', 'betting', 'playing', 'dealer_turn']))
            ->first();

        if ($existing) {
            return response()->json(['error' => 'Vous êtes déjà à une table.'], 422);
        }

        $table = BlackjackTable::create([
            'status'      => 'waiting',
            'max_players' => 4,
            'current_seat' => 0,
            'created_by'  => $user->id,
        ]);

        BlackjackPlayer::create([
            'table_id' => $table->id,
            'user_id'  => $user->id,
            'seat'     => 0,
            'status'   => 'waiting',
        ]);

        return response()->json(['table_id' => $table->id]);
    }

    // POST /casino/blackjack/{table}/join
    public function join(BlackjackTable $table): JsonResponse
    {
        $user = auth()->user();

        if (!in_array($table->status, ['waiting'])) {
            return response()->json(['error' => 'La partie a déjà commencé.'], 422);
        }

        // Check not already at a table
        $existing = BlackjackPlayer::where('user_id', $user->id)
            ->whereHas('blackjackTable', fn($q) => $q->whereIn('status', ['waiting', 'betting', 'playing', 'dealer_turn']))
            ->first();

        if ($existing) {
            return response()->json(['error' => 'Vous êtes déjà à une table.'], 422);
        }

        $seatsTaken = $table->players()->pluck('seat')->toArray();

        if (count($seatsTaken) >= $table->max_players) {
            return response()->json(['error' => 'La table est pleine.'], 422);
        }

        // Find next free seat
        $seat = 0;
        while (in_array($seat, $seatsTaken)) {
            $seat++;
        }

        BlackjackPlayer::create([
            'table_id' => $table->id,
            'user_id'  => $user->id,
            'seat'     => $seat,
            'status'   => 'waiting',
        ]);

        return response()->json(['table_id' => $table->id]);
    }

    // POST /casino/blackjack/{table}/leave
    public function leave(BlackjackTable $table): JsonResponse
    {
        $user   = auth()->user();
        $player = BlackjackPlayer::where('table_id', $table->id)
            ->where('user_id', $user->id)
            ->first();

        if (!$player) {
            return response()->json(['error' => 'Vous n\'êtes pas à cette table.'], 422);
        }

        if (in_array($table->status, ['playing', 'dealer_turn', 'betting'])) {
            return response()->json(['error' => 'Impossible de quitter en cours de partie.'], 422);
        }

        $player->delete();

        // If creator left and table is waiting, delete table
        if ($table->created_by === $user->id && $table->status === 'waiting') {
            $table->players()->delete();
            $table->delete();
        }

        return response()->json(['success' => true]);
    }

    // POST /casino/blackjack/{table}/start
    public function start(BlackjackTable $table): JsonResponse
    {
        $user = auth()->user();

        if ($table->created_by !== $user->id) {
            return response()->json(['error' => 'Seul le créateur peut démarrer.'], 403);
        }

        if ($table->status !== 'waiting') {
            return response()->json(['error' => 'La table ne peut pas être démarrée.'], 422);
        }

        if ($table->players()->count() < 1) {
            return response()->json(['error' => 'Pas assez de joueurs.'], 422);
        }

        $table->update([
            'status'          => 'betting',
            'last_action_at'  => now(),
        ]);

        // Update all players to waiting for bet
        $table->players()->update(['status' => 'waiting']);

        return response()->json(['success' => true]);
    }

    // POST /casino/blackjack/{table}/bet
    public function bet(BlackjackTable $table, Request $request): JsonResponse
    {
        $request->validate(['bet' => 'required|integer|min:1|max:10000']);

        $user   = auth()->user();
        $player = BlackjackPlayer::where('table_id', $table->id)
            ->where('user_id', $user->id)
            ->first();

        if (!$player) {
            return response()->json(['error' => 'Vous n\'êtes pas à cette table.'], 422);
        }

        if ($table->status !== 'betting') {
            return response()->json(['error' => 'La phase de mise n\'est pas ouverte.'], 422);
        }

        if ($player->status === 'bet_placed') {
            return response()->json(['error' => 'Vous avez déjà misé.'], 422);
        }

        if ($user->crystals < (int) $request->bet) {
            return response()->json(['error' => 'Pas assez de cristaux.'], 422);
        }

        $betAmount = (int) $request->bet;
        $user->crystals -= $betAmount;
        $user->save();

        $player->update([
            'bet'    => $betAmount,
            'status' => 'bet_placed',
        ]);

        // Check if all players have bet
        $allBet = $table->players()->where('status', '!=', 'bet_placed')->count() === 0;

        if ($allBet) {
            $this->dealInitialCards($table);
        }

        return response()->json($this->buildState($table->fresh(), $user));
    }

    // POST /casino/blackjack/{table}/hit
    public function hit(BlackjackTable $table): JsonResponse
    {
        $user   = auth()->user();
        $player = BlackjackPlayer::where('table_id', $table->id)
            ->where('user_id', $user->id)
            ->first();

        if (!$player) {
            return response()->json(['error' => 'Vous n\'êtes pas à cette table.'], 422);
        }

        if ($table->status !== 'playing') {
            return response()->json(['error' => 'Pas en phase de jeu.'], 422);
        }

        if ((int) $table->current_seat !== (int) $player->seat) {
            return response()->json(['error' => 'Ce n\'est pas votre tour.'], 422);
        }

        if (!in_array($player->status, ['playing'])) {
            return response()->json(['error' => 'Action non autorisée.'], 422);
        }

        $deck = $table->deck;
        $hand = $player->hand ?? [];
        $hand[] = BlackjackService::dealCard($deck);

        $table->deck = $deck;
        $table->save();

        $total = BlackjackService::handTotal($hand);

        if (BlackjackService::isBust($hand)) {
            $player->update(['hand' => $hand, 'status' => 'busted']);
            $this->advanceSeat($table->fresh());
        } else {
            $player->update(['hand' => $hand]);
        }

        return response()->json($this->buildState($table->fresh(), $user));
    }

    // POST /casino/blackjack/{table}/stand
    public function stand(BlackjackTable $table): JsonResponse
    {
        $user   = auth()->user();
        $player = BlackjackPlayer::where('table_id', $table->id)
            ->where('user_id', $user->id)
            ->first();

        if (!$player) {
            return response()->json(['error' => 'Vous n\'êtes pas à cette table.'], 422);
        }

        if ($table->status !== 'playing') {
            return response()->json(['error' => 'Pas en phase de jeu.'], 422);
        }

        if ((int) $table->current_seat !== (int) $player->seat) {
            return response()->json(['error' => 'Ce n\'est pas votre tour.'], 422);
        }

        if ($player->status !== 'playing') {
            return response()->json(['error' => 'Action non autorisée.'], 422);
        }

        $player->update(['status' => 'standing']);
        $this->advanceSeat($table->fresh());

        return response()->json($this->buildState($table->fresh(), $user));
    }

    // GET /casino/blackjack/{table}/state
    public function state(BlackjackTable $table): JsonResponse
    {
        $user = auth()->user();
        return response()->json($this->buildState($table, $user));
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    private function dealInitialCards(BlackjackTable $table): void
    {
        $deck = BlackjackService::createDeck(6);

        // Deal 2 cards to each player, then 2 to dealer
        $players = $table->players()->orderBy('seat')->get();

        foreach ($players as $player) {
            $hand   = [];
            $hand[] = BlackjackService::dealCard($deck);
            $hand[] = BlackjackService::dealCard($deck);

            $status = BlackjackService::isBlackjack($hand) ? 'blackjack' : 'playing';
            $player->update(['hand' => $hand, 'status' => $status]);
        }

        $dealerHand   = [];
        $dealerHand[] = BlackjackService::dealCard($deck);
        $dealerHand[] = BlackjackService::dealCard($deck);

        $table->update([
            'deck'            => $deck,
            'dealer_hand'     => $dealerHand,
            'status'          => 'playing',
            'current_seat'    => 0,
            'last_action_at'  => now(),
        ]);

        // If first seat is blackjack, advance
        $firstPlayer = $table->players()->orderBy('seat')->first();
        if ($firstPlayer && $firstPlayer->status === 'blackjack') {
            $this->advanceSeat($table->fresh());
        }
    }

    private function advanceSeat(BlackjackTable $table): void
    {
        $players    = $table->players()->orderBy('seat')->get();
        $currentSeat = (int) $table->current_seat;

        // Find next player that needs to play
        $nextSeat = null;
        foreach ($players as $player) {
            if ((int) $player->seat > $currentSeat && $player->status === 'playing') {
                $nextSeat = (int) $player->seat;
                break;
            }
        }

        if ($nextSeat !== null) {
            $table->update(['current_seat' => $nextSeat, 'last_action_at' => now()]);
        } else {
            // All players done — dealer plays
            $this->playDealer($table);
        }
    }

    private function playDealer(BlackjackTable $table): void
    {
        $deck       = $table->deck;
        $dealerHand = $table->dealer_hand ?? [];

        // Dealer hits until >= 17
        while (BlackjackService::handTotal($dealerHand) < 17) {
            $dealerHand[] = BlackjackService::dealCard($deck);
        }

        $table->update([
            'deck'           => $deck,
            'dealer_hand'    => $dealerHand,
            'status'         => 'finished',
            'last_action_at' => now(),
        ]);

        $this->resolvePayouts($table->fresh());
    }

    private function resolvePayouts(BlackjackTable $table): void
    {
        $dealerHand  = $table->dealer_hand ?? [];
        $dealerTotal = BlackjackService::handTotal($dealerHand);
        $dealerBust  = BlackjackService::isBust($dealerHand);

        foreach ($table->players()->get() as $player) {
            $hand        = $player->hand ?? [];
            $playerTotal = BlackjackService::handTotal($hand);
            $payout      = 0;

            if ($player->status === 'busted') {
                $player->update(['status' => 'lost']);
                continue;
            }

            if ($player->status === 'blackjack') {
                // Blackjack pays 2.5x (bet + 1.5x)
                $payout = (int) floor($player->bet * 2.5);
                $player->update(['status' => 'won']);
            } elseif ($dealerBust || $playerTotal > $dealerTotal) {
                $payout = $player->bet * 2;
                $player->update(['status' => 'won']);
            } elseif ($playerTotal === $dealerTotal) {
                $payout = $player->bet; // push — bet back
                $player->update(['status' => 'push']);
            } else {
                $payout = 0;
                $player->update(['status' => 'lost']);
            }

            if ($payout > 0) {
                $user = $player->user;
                $user->crystals += $payout;
                $user->save();
            }
        }
    }

    // POST /casino/blackjack/{table}/restart
    public function restart(BlackjackTable $table): JsonResponse
    {
        $user = auth()->user();

        if ($table->status !== 'finished') {
            return response()->json(['error' => 'La partie n\'est pas terminée.'], 422);
        }

        // Only players at the table can restart
        $isAtTable = BlackjackPlayer::where('table_id', $table->id)
            ->where('user_id', $user->id)
            ->exists();

        if (!$isAtTable) {
            return response()->json(['error' => 'Vous n\'êtes pas à cette table.'], 403);
        }

        // Reset table for a new round
        $table->update([
            'status'          => 'waiting',
            'deck'            => null,
            'dealer_hand'     => null,
            'current_seat'    => 0,
            'last_action_at'  => now(),
        ]);

        // Reset all players for new round
        $table->players()->update([
            'hand'   => null,
            'bet'    => 0,
            'status' => 'waiting',
        ]);

        return response()->json($this->buildState($table->fresh(), $user));
    }

    private function buildState(BlackjackTable $table, $authUser): array
    {
        $table->load(['players.user:id,username']);

        $dealerHand = $table->dealer_hand ?? [];

        // Mask first dealer card during 'playing'
        $maskedDealerHand = $dealerHand;
        if ($table->status === 'playing' && count($dealerHand) > 0) {
            $maskedDealerHand    = $dealerHand;
            $maskedDealerHand[0] = ['hidden' => true];
        }

        $dealerTotal = $table->status === 'playing'
            ? (count($dealerHand) > 1 ? BlackjackService::rankValue($dealerHand[1]['rank'] ?? 'A') : 0)
            : BlackjackService::handTotal($dealerHand);

        $myPlayer = null;

        $playersData = $table->players->map(function ($p) use ($authUser, &$myPlayer) {
            $hand  = $p->hand ?? [];
            $total = BlackjackService::handTotal($hand);

            $data = [
                'id'       => $p->id,
                'user_id'  => $p->user_id,
                'username' => $p->user?->username ?? 'Inconnu',
                'seat'     => $p->seat,
                'hand'     => $hand,
                'total'    => $total,
                'bet'      => $p->bet,
                'status'   => $p->status,
            ];

            if ($p->user_id === $authUser->id) {
                $myPlayer = $data;
            }

            return $data;
        })->values()->toArray();

        $isMyTurn = $myPlayer !== null
            && $table->status === 'playing'
            && (int) $table->current_seat === (int) ($myPlayer['seat'] ?? -1);

        return [
            'table'     => [
                'id'           => $table->id,
                'status'       => $table->status,
                'current_seat' => $table->current_seat,
                'dealer_hand'  => $maskedDealerHand,
                'dealer_total' => $dealerTotal,
                'created_by'   => $table->created_by,
            ],
            'players'   => $playersData,
            'my_player' => $myPlayer,
            'is_my_turn' => $isMyTurn,
        ];
    }

    private function formatTableSummary(BlackjackTable $table): array
    {
        return [
            'id'          => $table->id,
            'status'      => $table->status,
            'max_players' => $table->max_players,
            'player_count' => $table->players->count(),
            'players'     => $table->players->map(fn($p) => [
                'username' => $p->user?->username ?? 'Inconnu',
                'seat'     => $p->seat,
            ])->values(),
        ];
    }
}
