<?php

namespace App\Http\Controllers;

use App\Models\Friendship;
use App\Models\User;
use Inertia\Inertia;

class PlayerController extends Controller
{
    public function show(User $user)
    {
        $authUser = auth()->user();
        $user->load(['clan:id,name,crest_url,color,level,tier', 'commanders.commander']);

        // Friendship between auth user and target
        $friendship = Friendship::where(function ($q) use ($authUser, $user) {
            $q->where('requester_id', $authUser->id)->where('addressee_id', $user->id);
        })->orWhere(function ($q) use ($authUser, $user) {
            $q->where('requester_id', $user->id)->where('addressee_id', $authUser->id);
        })->first();

        $rarityOrder = ['legendary' => 0, 'epic' => 1, 'rare' => 2, 'common' => 3];

        $commanders = $user->commanders
            ->sortBy(fn($uc) => $rarityOrder[$uc->commander->rarity] ?? 9)
            ->values()
            ->map(fn($uc) => [
                'id'        => $uc->id,
                'name'      => $uc->commander->name,
                'title'     => $uc->commander->title,
                'rarity'    => $uc->commander->rarity,
                'is_active' => $uc->is_active,
            ]);

        return Inertia::render('PlayerProfile', [
            'profile' => [
                'id'           => $user->id,
                'username'     => $user->username,
                'level'        => $user->level,
                'crystals'     => $user->crystals,
                'war_points'   => $user->war_points,
                'clan_rank'    => $user->clan_rank,
                'last_seen_at' => $user->last_seen_at?->toIso8601String(),
                'created_at'   => $user->created_at->toIso8601String(),
                'clan'         => $user->clan ? [
                    'id'        => $user->clan->id,
                    'name'      => $user->clan->name,
                    'crest_url' => $user->clan->crest_url,
                    'color'     => $user->clan->color,
                    'level'     => $user->clan->level,
                    'tier'      => $user->clan->tier,
                ] : null,
                'commanders'   => $commanders,
            ],
            'is_self'           => $authUser->id === $user->id,
            'friendship_status' => $friendship?->status,
            'friendship_id'     => $friendship?->id,
            'i_am_requester'    => $friendship ? ($friendship->requester_id === $authUser->id) : null,
        ]);
    }
}
