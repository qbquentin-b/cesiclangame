<?php

namespace App\Http\Controllers;

use App\Models\Chest;
use App\Models\Claim;
use App\Models\Drop;
use App\Models\War;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user()->load('clan');

        $drops = Drop::where('expires_at', '>', now())
            ->where('current_claims', '<', DB::raw('max_claims'))
            ->orderBy('expires_at')
            ->get();

        $userClaims = Claim::where('user_id', $user->id)->pluck('drop_id')->toArray();

        $warsQuery = War::with(['clanA', 'clanB'])->latest();
        if ($user->clan_id) {
            $warsQuery->where(function ($q) use ($user) {
                $q->where('clan_a_id', $user->clan_id)
                  ->orWhere('clan_b_id', $user->clan_id);
            });
        }
        $recentWars = $warsQuery->take(5)->get();

        $chestCount = Chest::where('user_id', $user->id)->where('status', 'unopened')->count();

        return Inertia::render('Dashboard', [
            'activeDrops' => $drops,
            'userClaims'  => $userClaims,
            'recentWars'  => $recentWars,
            'chestCount'  => $chestCount,
        ]);
    }
}
