<?php

namespace App\Http\Controllers;

use App\Models\Chest;
use App\Models\Commander;
use App\Models\UserCommander;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

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

        $commanderData = null;
        if (!empty($contents['commander'])) {
            $commander = Commander::find($contents['commander']);
            if ($commander) {
                UserCommander::create([
                    'id'           => Str::uuid(),
                    'user_id'      => $user->id,
                    'commander_id' => $commander->id,
                    'is_active'    => false,
                    'obtained_at'  => now(),
                ]);
                $rarityEmoji = match($commander->rarity) {
                    'legendary' => '👑',
                    'epic'      => '🏆',
                    'rare'      => '⚜️',
                    default     => '⚔️',
                };
                $commanderData = [
                    'name'   => $commander->name,
                    'title'  => $commander->title,
                    'rarity' => $commander->rarity,
                    'emoji'  => $rarityEmoji,
                ];
            }
        }
        $contents['commander'] = $commanderData;

        $chest->update([
            'status'    => 'opened',
            'contents'  => $contents,
            'opened_at' => now(),
        ]);

        return back()->with('flash', ['chestOpened' => $contents]);
    }
}
