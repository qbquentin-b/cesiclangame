<?php

namespace App\Http\Controllers;

use App\Models\Chest;
use App\Models\Hero;
use App\Models\UserHero;
use Illuminate\Http\Request;

class ChestController extends Controller
{
    public function index()
    {
        $chests = Chest::where('user_id', auth()->id())
            ->orderBy('obtained_at', 'desc')
            ->get();

        return response()->json($chests);
    }

    public function open(Chest $chest)
    {
        if ($chest->user_id !== auth()->id()) abort(403);
        if ($chest->status === 'opened') {
            return back()->withErrors(['message' => 'Ce coffre est déjà ouvert.']);
        }

        $contents = Chest::rollContents($chest->chest_type);

        $user = auth()->user();
        $user->food     += $contents['food']     ?? 0;
        $user->wood     += $contents['wood']     ?? 0;
        $user->metal    += $contents['metal']    ?? 0;
        $user->gold     += $contents['gold']     ?? 0;
        $user->crystals += $contents['crystals'] ?? 0;
        $user->save();

        $heroData = null;
        if (!empty($contents['hero'])) {
            $hero = Hero::find($contents['hero']);
            if ($hero) {
                \DB::table('user_heroes')->insert([
                    'user_id'     => $user->id,
                    'hero_id'     => $hero->id,
                    'obtained_at' => now(),
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]);
                $heroData = ['name' => $hero->name, 'emoji' => $hero->emoji];
            }
            $contents['hero'] = $heroData;
        }

        $chest->update([
            'status'    => 'opened',
            'contents'  => $contents,
            'opened_at' => now(),
        ]);

        return back()->with('flash', ['chestOpened' => $contents]);
    }
}
