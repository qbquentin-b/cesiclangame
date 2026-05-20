<?php

namespace App\Http\Controllers;

use App\Models\Claim;
use App\Models\Commander;
use App\Models\Drop;
use App\Models\User;
use App\Models\UserCommander;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DropController extends Controller
{
    public function index()
    {
        $drops = Drop::where('expires_at', '>', now())
            ->where('current_claims', '<', DB::raw('max_claims'))
            ->get();
        $userClaims = Claim::where('user_id', auth()->id())->pluck('drop_id')->toArray();
        $commanders = Commander::orderBy('rarity')->get();

        return Inertia::render('DropsView', [
            'activeDrops' => $drops,
            'userClaims'  => $userClaims,
            'commanders'  => $commanders,
        ]);
    }

    public function claim(Request $request, Drop $drop)
    {
        $user = $request->user();

        return DB::transaction(function () use ($user, $drop) {
            // Lock the drop row
            $drop = Drop::where('id', $drop->id)->lockForUpdate()->first();

            if ($drop->expires_at && $drop->expires_at->isPast()) {
                return back()->withErrors(['message' => 'Drop expired']);
            }

            if ($drop->current_claims >= $drop->max_claims) {
                return back()->withErrors(['message' => 'Drop fully claimed']);
            }

            if (Claim::where('drop_id', $drop->id)->where('user_id', $user->id)->exists()) {
                return back()->withErrors(['message' => 'Already claimed']);
            }

            // Create claim
            Claim::create([
                'drop_id' => $drop->id,
                'user_id' => $user->id,
            ]);

            $drop->current_claims += 1;
            $drop->save();

            // Reward user
            $user = User::where('id', $user->id)->lockForUpdate()->first();

            if ($drop->type === 'crystals') {
                $user->crystals += $drop->value;
                $user->save();
            } elseif ($drop->type === 'commander') {
                $commander = $this->rollCommander();
                UserCommander::create([
                    'user_id'     => $user->id,
                    'commander_id' => $commander->id,
                    'is_active'   => false,
                    'obtained_at' => now(),
                ]);
                return back()->with(['message' => "Commandant obtenu : {$commander->name} ({$commander->rarity}) !"]);
            }

            return back()->with(['message' => 'Claim successful!']);
        });
    }

    private function rollCommander(): Commander
    {
        // Weighted rarity: common 40%, rare 30%, epic 20%, legendary 10%
        $roll = rand(1, 100);
        $rarity = match (true) {
            $roll <= 10 => 'legendary',
            $roll <= 30 => 'epic',
            $roll <= 60 => 'rare',
            default     => 'common',
        };

        $commanders = Commander::where('rarity', $rarity)->get();
        if ($commanders->isEmpty()) {
            $commanders = Commander::all();
        }

        return $commanders->random();
    }
}
