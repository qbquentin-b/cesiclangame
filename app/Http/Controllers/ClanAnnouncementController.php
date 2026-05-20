<?php

namespace App\Http\Controllers;

use App\Models\ClanAnnouncement;
use Illuminate\Http\Request;

class ClanAnnouncementController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:100',
            'body'  => 'required|string|max:1000',
        ]);

        $user = $request->user();

        if (!in_array($user->clan_rank, ['leader', 'officer'])) {
            return back()->withErrors(['message' => 'Seuls le chef et les officiers peuvent envoyer des annonces.']);
        }

        ClanAnnouncement::create([
            'clan_id'   => $user->clan_id,
            'sender_id' => $user->id,
            'title'     => $request->title,
            'body'      => $request->body,
        ]);

        return back()->with('message', 'Annonce publiée !');
    }

    public function destroy(Request $request, ClanAnnouncement $announcement)
    {
        $user = $request->user();

        if ($user->clan_rank !== 'leader' && $announcement->sender_id !== $user->id) {
            return back()->withErrors(['message' => 'Vous ne pouvez pas supprimer cette annonce.']);
        }

        if ($announcement->clan_id !== $user->clan_id) {
            return back()->withErrors(['message' => 'Annonce introuvable.']);
        }

        $announcement->delete();

        return back()->with('message', 'Annonce supprimée.');
    }
}
