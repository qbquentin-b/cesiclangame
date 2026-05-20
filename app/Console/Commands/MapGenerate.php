<?php

namespace App\Console\Commands;

use App\Models\MapZone;
use Illuminate\Console\Command;

class MapGenerate extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'map:generate {--amount=200}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate the world map grids';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $amount = (int)$this->option('amount');
        $this->info("Generating {$amount} provinces...");

        $types = ['plains', 'plains', 'forest', 'mountain', 'desert'];
        $names = ['Vallée', 'Plaine', 'Forêt', 'Mont', 'Désert', 'Région', 'Province', 'Terres', 'Ruines', 'Collines', 'Duché'];
        $adjectives = ['Maudit', 'Ancien', 'Oublié', 'Sombre', 'Doré', 'Silencieux', 'Brisé', 'Lointain', 'du Nord', 'du Sud', 'du Levant'];

        MapZone::query()->delete();

        $bar = $this->output->createProgressBar($amount);
        $bar->start();

        // Use a Poisson-disk sampling or simply random with relaxation (Lloyd's algorithm approximation)
        // For simplicity, random with minimal distance checks
        $points = [];
        $width = 1000;
        $height = 1000;

        for ($i = 0; $i < $amount; $i++) {
            $x = rand(10, $width - 10);
            $y = rand(10, $height - 10);
            
            $type = $types[array_rand($types)];
            $name = $names[array_rand($names)] . ' ' . $adjectives[array_rand($adjectives)];

            $biomeResources = \App\Models\MapZone::BIOME_RESOURCES[$type] ?? ['primary' => 'food', 'secondary' => null];
            $reserveMax     = rand(200, 600);
            $reservePrimary = rand((int)($reserveMax * 0.4), $reserveMax); // Start between 40%-100% full

            MapZone::create([
                'x_coord'            => $x,
                'y_coord'            => $y,
                'name'               => $name,
                'type'               => $type,
                'resource_primary'   => $biomeResources['primary'],
                'resource_secondary' => $biomeResources['secondary'],
                'reserve_primary'    => $reservePrimary,
                'reserve_secondary'  => $biomeResources['secondary'] ? rand(50, 200) : null,
                'reserve_max'        => $reserveMax,
            ]);
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Map generated successfully!");
    }
}
