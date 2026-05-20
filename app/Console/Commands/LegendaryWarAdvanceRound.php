<?php

namespace App\Console\Commands;

use App\Models\LegendaryWar;
use App\Models\LegendaryWarRound;
use App\Services\LegendaryWarService;
use Illuminate\Console\Command;

class LegendaryWarAdvanceRound extends Command
{
    protected $signature   = 'legendary-war:advance-round';
    protected $description = 'Résout les rounds expirés des batailles légendaires';

    public function handle(LegendaryWarService $service): void
    {
        $activeWars = LegendaryWar::where('status', 'active')->get();

        foreach ($activeWars as $war) {
            $currentRound = LegendaryWarRound::where('legendary_war_id', $war->id)
                ->where('round_number', $war->current_round)
                ->first();

            if (!$currentRound) continue;
            if ($currentRound->status === 'finished') continue;
            if ($currentRound->ends_at && $currentRound->ends_at->isFuture()) continue;

            $this->info("Résolution round {$currentRound->round_number} — Guerre légendaire {$war->id}");
            $service->advanceRound($war);
        }
    }
}
