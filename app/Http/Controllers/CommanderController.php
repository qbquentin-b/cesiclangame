<?php

namespace App\Http\Controllers;

use App\Models\UserCommander;
use Illuminate\Http\Request;

class CommanderController extends Controller
{
    public function setActive(Request $request, UserCommander $userCommander)
    {
        $user = auth()->user();

        if ($userCommander->user_id !== $user->id) {
            abort(403);
        }

        // Deactivate all others for this user
        UserCommander::where('user_id', $user->id)->update(['is_active' => false]);

        // Activate the selected one
        $userCommander->is_active = true;
        $userCommander->save();

        return back()->with('message', "Commandant {$userCommander->commander->name} activé !");
    }

    public function deactivate(Request $request)
    {
        UserCommander::where('user_id', auth()->id())->update(['is_active' => false]);
        return back()->with('message', 'Commandant désactivé.');
    }
}
