<?php

namespace App\Http\Controllers;

use App\Models\Resource;
use App\Models\Weapon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CraftingController extends Controller
{
    public function craft(Request $request)
    {
        $request->validate([
            'weapon_type' => 'required|string',
        ]);

        $user = $request->user();

        // Simple crafting logic: requires 10 of 'metal' and 5 of 'food'
        return DB::transaction(function () use ($user, $request) {
            $u = \App\Models\User::where('id', $user->id)->lockForUpdate()->first();

            if ($u->metal < 10 || $u->food < 5) {
                return back()->withErrors(['message' => 'Ressources insuffisantes.']);
            }

            $u->metal -= 10;
            $u->food  -= 5;
            $u->save();

            Weapon::create([
                'user_id' => $user->id,
                'clan_id' => $user->clan_id,
                'type' => $request->weapon_type,
                'stats' => ['power' => rand(10, 50)],
            ]);

            return back()->with('message', 'Weapon crafted successfully!');
        });
    }
}
