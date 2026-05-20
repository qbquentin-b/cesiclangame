<?php

namespace App\Console\Commands;

use App\Models\War;
use App\Services\WarService;
use Illuminate\Console\Command;

class WarAutoResolve extends Command
{
    protected $signature   = 'war:auto-resolve {--hours=24 : Resolve wars older than this many hours}';
    protected $description = 'Automatically resolve active wars after the given time limit';

    public function handle(WarService $warService): void
    {
        $hours  = (int) $this->option('hours');
        $cutoff = now()->subHours($hours);

        $wars = War::whereIn('status', ['pending', 'active'])
            ->where('scheduled_at', '<=', $cutoff)
            ->get();

        if ($wars->isEmpty()) {
            $this->info('No wars to resolve.');
            return;
        }

        foreach ($wars as $war) {
            $warService->resolve($war);
            $this->info("War {$war->id} resolved (A:{$war->score_a} vs B:{$war->score_b})");
        }
    }
}
