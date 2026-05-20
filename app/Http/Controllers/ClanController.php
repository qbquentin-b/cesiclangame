<?php

namespace App\Http\Controllers;

use App\Models\Clan;
use App\Models\ClanAnnouncement;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ClanController extends Controller
{
    // leader > officer > veteran > member
    private const HIERARCHY = ['leader' => 3, 'officer' => 2, 'veteran' => 1, 'member' => 0];

    public function index(Request $request)
    {
        $user = $request->user();
        $clan = null;
        $members = [];
        $publicClans = [];
        $announcements = [];

        if ($user->clan_id) {
            $clan = Clan::find($user->clan_id);
            $members = User::where('clan_id', $clan->id)
                ->orderByRaw("CASE clan_rank WHEN 'leader' THEN 0 WHEN 'officer' THEN 1 WHEN 'veteran' THEN 2 ELSE 3 END")
                ->get();
            $announcements = ClanAnnouncement::where('clan_id', $clan->id)
                ->with('sender:id,username,clan_rank')
                ->latest()
                ->take(10)
                ->get()
                ->map(fn ($a) => [
                    'id'         => $a->id,
                    'title'      => $a->title,
                    'body'       => $a->body,
                    'sender'     => ['username' => $a->sender->username, 'clan_rank' => $a->sender->clan_rank],
                    'created_at' => $a->created_at,
                    'can_delete' => $user->clan_rank === 'leader' || $a->sender_id === $user->id,
                ]);
        } else {
            $publicClans = Clan::all();
        }

        return Inertia::render('ClanView', [
            'clan'          => $clan,
            'members'       => $members,
            'publicClans'   => $publicClans,
            'announcements' => $announcements,
        ]);
    }

    public function create(Request $request)
    {
        $request->validate([
            'name' => 'required|string|unique:clans,name|max:255',
        ]);

        $user = $request->user();

        return DB::transaction(function () use ($user, $request) {
            $user = User::where('id', $user->id)->lockForUpdate()->first();

            if ($user->crystals < 50) {
                return back()->withErrors(['message' => 'Pas assez de cristaux (50 requis)']);
            }

            if ($user->clan_id) {
                return back()->withErrors(['message' => 'Vous êtes déjà dans un clan']);
            }

            $user->crystals    -= 50;
            $user->total_spent += 50;
            $user->save();

            $colors = ['#ad2b1f', '#3c6704', '#1f5dad', '#765a19', '#6b2082', '#0f6e6e', '#a85b14', '#2a3b4c'];
            $color = $colors[array_rand($colors)];

            $clan = Clan::create([
                'name'  => $request->name,
                'color' => $color,
            ]);

            $user->clan_id   = $clan->id;
            $user->clan_rank = 'leader';
            $user->save();

            $zone = \App\Models\MapZone::whereNull('clan_id')->inRandomOrder()->first();
            if ($zone) {
                $zone->clan_id    = $clan->id;
                $zone->is_capital = true;
                $zone->save();
            }

            return redirect()->route('clan');
        });
    }

    public function join(Request $request, Clan $clan)
    {
        $user = $request->user();

        if ($user->clan_id) {
            return back()->withErrors(['message' => 'Vous êtes déjà dans un clan']);
        }

        $user->clan_id   = $clan->id;
        $user->clan_rank = 'member';
        $user->save();

        return redirect()->route('clan');
    }

    public function promote(Request $request, User $target)
    {
        $user = $request->user();

        if ($user->clan_rank !== 'leader') {
            return back()->withErrors(['message' => 'Seul le chef peut promouvoir des membres.']);
        }

        if ($user->clan_id !== $target->clan_id) {
            return back()->withErrors(['message' => 'Ce joueur n\'est pas dans votre clan.']);
        }

        if ($target->id === $user->id) {
            return back()->withErrors(['message' => 'Vous ne pouvez pas vous promouvoir vous-même.']);
        }

        $promoteMap = ['member' => 'veteran', 'veteran' => 'officer', 'officer' => 'leader'];

        if (!isset($promoteMap[$target->clan_rank])) {
            return back()->withErrors(['message' => 'Impossible de promouvoir ce membre.']);
        }

        $newRank = $promoteMap[$target->clan_rank];

        // Transfert de chef : l'ancien chef devient officier
        if ($newRank === 'leader') {
            $user->clan_rank = 'officer';
            $user->save();
        }

        $target->clan_rank = $newRank;
        $target->save();

        return back()->with('message', "{$target->username} a été promu(e).");
    }

    public function demote(Request $request, User $target)
    {
        $user = $request->user();

        if ($user->clan_rank !== 'leader') {
            return back()->withErrors(['message' => 'Seul le chef peut rétrograder des membres.']);
        }

        if ($user->clan_id !== $target->clan_id) {
            return back()->withErrors(['message' => 'Ce joueur n\'est pas dans votre clan.']);
        }

        if ($target->id === $user->id) {
            return back()->withErrors(['message' => 'Vous ne pouvez pas vous rétrograder vous-même.']);
        }

        $demoteMap = ['officer' => 'veteran', 'veteran' => 'member'];

        if (!isset($demoteMap[$target->clan_rank])) {
            return back()->withErrors(['message' => 'Impossible de rétrograder ce membre.']);
        }

        $target->clan_rank = $demoteMap[$target->clan_rank];
        $target->save();

        return back()->with('message', "{$target->username} a été rétrogradé(e).");
    }

    public function kick(Request $request, User $target)
    {
        $user = $request->user();

        if ($user->clan_id !== $target->clan_id) {
            return back()->withErrors(['message' => 'Ce joueur n\'est pas dans votre clan.']);
        }

        if ($target->id === $user->id) {
            return back()->withErrors(['message' => 'Vous ne pouvez pas vous expulser vous-même.']);
        }

        $myLevel     = self::HIERARCHY[$user->clan_rank]     ?? -1;
        $targetLevel = self::HIERARCHY[$target->clan_rank]   ?? -1;

        if ($myLevel <= $targetLevel) {
            return back()->withErrors(['message' => 'Vous ne pouvez pas expulser ce membre.']);
        }

        $target->clan_id   = null;
        $target->clan_rank = null;
        $target->save();

        return back()->with('message', "{$target->username} a été expulsé(e) du clan.");
    }

    public function updateLogo(Request $request)
    {
        $request->validate([
            'logo' => 'required|image|max:2048|mimes:jpg,jpeg,png,gif,webp',
        ]);

        $user = $request->user();

        if (!$user->clan_id || $user->clan_rank !== 'leader') {
            return back()->withErrors(['message' => 'Seul le chef de clan peut modifier le logo.']);
        }

        $path = $request->file('logo')->store('clan_logos', 'public');
        $url  = Storage::url($path);

        Clan::where('id', $user->clan_id)->update(['crest_url' => $url]);

        return back()->with('message', 'Logo du clan mis à jour !');
    }

    public function donate(Request $request)
    {
        $request->validate([
            'amount' => 'required|integer|min:1',
        ]);

        $user = $request->user();

        return DB::transaction(function () use ($user, $request) {
            $user = User::where('id', $user->id)->lockForUpdate()->first();
            if ($user->crystals < $request->amount) {
                return back()->withErrors(['message' => 'Pas assez de cristaux']);
            }
            if (!$user->clan_id) {
                return back()->withErrors(['message' => 'Vous n\'êtes pas dans un clan']);
            }

            $user->crystals -= $request->amount;
            $user->save();

            $clan = Clan::where('id', $user->clan_id)->lockForUpdate()->first();
            $clan->crystals_pool += $request->amount;
            $clan->save();

            return back()->with('message', 'Don effectué à la trésorerie');
        });
    }
}
