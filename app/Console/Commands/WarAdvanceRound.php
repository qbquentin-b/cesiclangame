<?php

namespace App\Console\Commands;

use App\Models\WarRound;
use App\Services\WarService;
use Illuminate\Console\Command;

class WarAdvanceRound extends Command
{
    protected $signature   = 'war:advance-round';
    protected $description = 'Résout les rounds de guerre expirés et active le round suivant';

    public function handle(WarService $warService): void
    {
        $rounds = WarRound::where('status', 'active')
            ->where('ends_at', '<=', now())
            ->with('war')
            ->get();

        if ($rounds->isEmpty()) {
            $this->info('Aucun round à avancer.');
            return;
        }

        foreach ($rounds as $round) {
            $warService->advanceRound($round->war);
            $this->info("Guerre {$round->war_id} — round {$round->round_number} résolu.");
        }
    }
}
