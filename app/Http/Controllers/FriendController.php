<?php

namespace App\Http\Controllers;

use App\Models\Friendship;
use App\Models\User;
use Illuminate\Http\Request;

class FriendController extends Controller
{
    public function request(Request $request)
    {
        $request->validate(['username' => 'required|string']);

        $target = User::where('username', $request->username)->first();

        if (!$target) {
            return back()->withErrors(['message' => "Joueur introuvable."]);
        }

        if ($target->id === $request->user()->id) {
            return back()->withErrors(['message' => "Vous ne pouvez pas vous ajouter vous-même."]);
        }

        $exists = Friendship::where(function ($q) use ($request, $target) {
            $q->where('requester_id', $request->user()->id)->where('addressee_id', $target->id);
        })->orWhere(function ($q) use ($request, $target) {
            $q->where('requester_id', $target->id)->where('addressee_id', $request->user()->id);
        })->exists();

        if ($exists) {
            return back()->withErrors(['message' => "Une demande existe déjà avec ce joueur."]);
        }

        Friendship::create([
            'requester_id' => $request->user()->id,
            'addressee_id' => $target->id,
            'status'       => 'pending',
        ]);

        return back()->with('message', "Demande envoyée à {$target->username} !");
    }

    public function accept(Friendship $friendship, Request $request)
    {
        if ($friendship->addressee_id !== $request->user()->id) {
            return back()->withErrors(['message' => "Action non autorisée."]);
        }

        $friendship->status = 'accepted';
        $friendship->save();

        return back()->with('message', "Vous êtes maintenant amis avec {$friendship->requester->username} !");
    }

    public function decline(Friendship $friendship, Request $request)
    {
        if ($friendship->addressee_id !== $request->user()->id) {
            return back()->withErrors(['message' => "Action non autorisée."]);
        }

        $friendship->delete();
        return back()->with('message', "Demande refusée.");
    }

    public function remove(User $user, Request $request)
    {
        Friendship::where(function ($q) use ($request, $user) {
            $q->where('requester_id', $request->user()->id)->where('addressee_id', $user->id);
        })->orWhere(function ($q) use ($request, $user) {
            $q->where('requester_id', $user->id)->where('addressee_id', $request->user()->id);
        })->delete();

        return back()->with('message', "Ami retiré.");
    }
}
