<?php

namespace App\Console\Commands;

use App\Models\MapZone;
use Illuminate\Console\Command;

class MapResolveConquests extends Command
{
    protected $signature = 'map:resolve-conquests';
    protected $description = 'Finalize all pending zone conquests whose timer has expired';

    public function handle()
    {
        $durations = [
            'plains'   => 5,
            'forest'   => 15,
            'desert'   => 30,
            'mountain' => 60,
        ];

        $resolved = 0;

        $pendingZones = MapZone::whereNotNull('conquering_clan_id')
            ->whereNotNull('conquest_started_at')
            ->get();

        foreach ($pendingZones as $zone) {
            $durationMinutes = $durations[$zone->type] ?? 10;
            $conquestEndsAt = $zone->conquest_started_at->addMinutes($durationMinutes);

            if (now()->isAfter($conquestEndsAt)) {
                $zone->clan_id = $zone->conquering_clan_id;
                $zone->conquering_clan_id = null;
                $zone->conquest_started_at = null;
                $zone->save();
                $resolved++;
            }
        }

        $this->info("Resolved {$resolved} conquest(s).");
    }
}
