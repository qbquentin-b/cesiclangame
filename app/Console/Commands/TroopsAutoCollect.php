<?php

namespace App\Console\Commands;

use App\Models\UserTroop;
use Illuminate\Console\Command;

class TroopsAutoCollect extends Command
{
    protected $signature   = 'troops:auto-collect';
    protected $description = 'Automatically add finished training troops to player inventories';

    public function handle(): void
    {
        // Récupération des entraînements terminés
        $ready = UserTroop::where('in_training', '>', 0)
            ->whereNotNull('training_done_at')
            ->where('training_done_at', '<=', now())
            ->get();

        $count = 0;
        foreach ($ready as $troop) {
            $troop->quantity        += $troop->in_training;
            $troop->in_training      = 0;
            $troop->training_done_at = null;
            $troop->save();
            $count++;
        }

        // Guérison des blessés
        $healed = UserTroop::where('wounded', '>', 0)
            ->whereNotNull('healed_at')
            ->where('healed_at', '<=', now())
            ->get();

        $healCount = 0;
        foreach ($healed as $troop) {
            $troop->quantity  += $troop->wounded;
            $troop->wounded    = 0;
            $troop->healed_at  = null;
            $troop->save();
            $healCount++;
        }

        $this->info("Auto-collected {$count} troop batch(es). Healed {$healCount} wounded batch(es).");
    }
}
