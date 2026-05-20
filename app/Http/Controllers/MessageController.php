<?php

namespace App\Http\Controllers;

use App\Models\Friendship;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MessageController extends Controller
{
    public function index(Request $request)
    {
        $user    = $request->user();
        $friends = $this->getFriends($user);

        // Last message + unread count per friend
        $conversations = $friends->map(function ($friend) use ($user) {
            $last = Message::where(function ($q) use ($user, $friend) {
                $q->where('sender_id', $user->id)->where('receiver_id', $friend->id);
            })->orWhere(function ($q) use ($user, $friend) {
                $q->where('sender_id', $friend->id)->where('receiver_id', $user->id);
            })->latest()->first();

            $unread = Message::where('sender_id', $friend->id)
                ->where('receiver_id', $user->id)
                ->whereNull('read_at')
                ->count();

            return [
                'friend'  => $this->formatUser($friend),
                'last'    => $last ? ['body' => $last->body, 'at' => $last->created_at] : null,
                'unread'  => $unread,
            ];
        })->sortByDesc(fn ($c) => $c['last']['at'] ?? null)->values();

        $pending = Friendship::where('addressee_id', $user->id)
            ->where('status', 'pending')
            ->with('requester')
            ->get()
            ->map(fn ($f) => ['id' => $f->id, 'user' => $this->formatUser($f->requester)]);

        $clan = null;
        if ($user->clan_id) {
            $clan = \App\Models\Clan::select('id', 'name', 'color', 'crest_url')->find($user->clan_id);
        }

        return Inertia::render('PigeonView', [
            'conversations'    => $conversations,
            'pendingRequests'  => $pending,
            'clan'             => $clan,
        ]);
    }

    public function thread(Request $request, User $user)
    {
        $me = $request->user();

        // Mark incoming messages as read
        Message::where('sender_id', $user->id)
            ->where('receiver_id', $me->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        $messages = Message::where(function ($q) use ($me, $user) {
            $q->where('sender_id', $me->id)->where('receiver_id', $user->id);
        })->orWhere(function ($q) use ($me, $user) {
            $q->where('sender_id', $user->id)->where('receiver_id', $me->id);
        })->oldest()->get()->map(fn ($m) => [
            'id'        => $m->id,
            'body'      => $m->body,
            'mine'      => $m->sender_id === $me->id,
            'read_at'   => $m->read_at,
            'created_at'=> $m->created_at,
        ]);

        return response()->json($messages);
    }

    public function send(Request $request, User $user)
    {
        $request->validate(['body' => 'required|string|max:1000']);

        $me = $request->user();

        // Only friends can message each other
        $areFriends = Friendship::where('status', 'accepted')->where(function ($q) use ($me, $user) {
            $q->where('requester_id', $me->id)->where('addressee_id', $user->id);
        })->orWhere(function ($q) use ($me, $user) {
            $q->where('status', 'accepted')
              ->where('requester_id', $user->id)->where('addressee_id', $me->id);
        })->exists();

        if (!$areFriends) {
            return response()->json(['error' => 'Vous devez être amis pour envoyer un message.'], 403);
        }

        $msg = Message::create([
            'sender_id'   => $me->id,
            'receiver_id' => $user->id,
            'body'        => $request->body,
        ]);

        return response()->json([
            'id'         => $msg->id,
            'body'       => $msg->body,
            'mine'       => true,
            'read_at'    => null,
            'created_at' => $msg->created_at,
        ]);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function getFriends(User $user)
    {
        $asRequester = Friendship::where('requester_id', $user->id)
            ->where('status', 'accepted')
            ->with('addressee')
            ->get()
            ->pluck('addressee');

        $asAddressee = Friendship::where('addressee_id', $user->id)
            ->where('status', 'accepted')
            ->with('requester')
            ->get()
            ->pluck('requester');

        return $asRequester->merge($asAddressee);
    }

    private function formatUser(User $u): array
    {
        return [
            'id'           => $u->id,
            'username'     => $u->username,
            'level'        => $u->level ?? 1,
            'clan'         => $u->clan?->name,
            'is_online'    => $u->last_seen_at && $u->last_seen_at->gt(now()->subMinutes(3)),
            'last_seen_at' => $u->last_seen_at,
        ];
    }
}
