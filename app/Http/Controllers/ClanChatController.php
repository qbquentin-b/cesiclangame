<?php

namespace App\Http\Controllers;

use App\Models\ClanMessage;
use Illuminate\Http\Request;

class ClanChatController extends Controller
{
    public function messages(Request $request)
    {
        $user = $request->user();

        if (!$user->clan_id) {
            return response()->json(['error' => 'Vous n\'êtes pas dans un clan.'], 403);
        }

        $messages = ClanMessage::where('clan_id', $user->clan_id)
            ->with('sender:id,username,clan_rank')
            ->latest()
            ->take(60)
            ->get()
            ->reverse()
            ->values()
            ->map(fn ($m) => [
                'id'         => $m->id,
                'body'       => $m->body,
                'mine'       => $m->sender_id === $user->id,
                'sender'     => ['username' => $m->sender->username, 'clan_rank' => $m->sender->clan_rank],
                'created_at' => $m->created_at,
            ]);

        return response()->json($messages);
    }

    public function send(Request $request)
    {
        $request->validate(['body' => 'required|string|max:500']);

        $user = $request->user();

        if (!$user->clan_id) {
            return response()->json(['error' => 'Vous n\'êtes pas dans un clan.'], 403);
        }

        $msg = ClanMessage::create([
            'clan_id'   => $user->clan_id,
            'sender_id' => $user->id,
            'body'      => $request->body,
        ]);

        return response()->json([
            'id'         => $msg->id,
            'body'       => $msg->body,
            'mine'       => true,
            'sender'     => ['username' => $user->username, 'clan_rank' => $user->clan_rank],
            'created_at' => $msg->created_at,
        ]);
    }
}
