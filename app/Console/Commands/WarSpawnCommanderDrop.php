<?php

namespace App\Console\Commands;

use App\Models\Drop;
use Illuminate\Console\Command;

class WarSpawnCommanderDrop extends Command
{
    protected $signature   = 'war:spawn-commander-drop';
    protected $description = 'Randomly spawn a commander chest drop for all players';

    protected array $titles = [
        'Coffre de Guerre',
        'Trésor du Général',
        'Relique des Anciens',
        'Butin de Campagne',
        'Coffre Militaire',
    ];

    public function handle(): void
    {
        // 25% chance each time the command runs
        if (rand(1, 100) > 25) {
            $this->info('No commander drop this time.');
            return;
        }

        $title = $this->titles[array_rand($this->titles)];

        Drop::create([
            'title'         => $title,
            'description'   => 'Ouvre ce coffre pour obtenir un grand commandant militaire qui renforcera vos armées.',
            'type'          => 'commander',
            'value'         => 1,
            'max_claims'    => rand(20, 100),
            'expires_at'    => now()->addHours(rand(3, 8)),
        ]);

        $this->info("Commander drop spawned: {$title}");
    }
}
