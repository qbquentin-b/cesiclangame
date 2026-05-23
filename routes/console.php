<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Models\Drop;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::call(function () {
    // 30% chance to spawn a drop every 30 mins
    if (rand(1, 100) <= 30) {
        $types = ['crystals', 'resource', 'weapon_plan', 'boost'];
        $type = $types[array_rand($types)];
        Drop::create([
            'title' => 'Random ' . ucfirst($type) . ' Drop',
            'type' => $type,
            'description' => 'A mysterious drop appeared!',
            'value' => rand(50, 500),
            'max_claims' => rand(5, 50),
            'expires_at' => now()->addHours(2),
        ]);
    }
})->everyThirtyMinutes()->between('08:30', '17:00');

Schedule::command('map:resolve-conquests')->everyMinute();
Schedule::command('map:produce-resources')->hourly();

// War system — rounds actifs uniquement entre 08h et 22h
Schedule::command('war:advance-round')->hourly()->between('08:00', '22:00');
Schedule::command('war:auto-resolve --hours=24')->hourly()->between('08:00', '22:00');
Schedule::command('troops:auto-collect')->everyFiveMinutes();
Schedule::command('war:spawn-commander-drop')->everyThreeHours()->between('09:00', '23:00');
Schedule::command('legendary-war:advance-round')->hourly();
Schedule::command('daily-games:award-chests')->dailyAt('09:00');
