<?php

namespace App\Console\Commands;

use App\Models\MapZone;
use App\Models\User;
use App\Models\ZoneBuilding;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MapProduceResources extends Command
{
    protected $signature   = 'map:produce-resources';
    protected $description = 'Produce resources from zone extractors and distribute to clan members';

    public function handle()
    {
        $processed = 0;

        // Get all zones with extractor/farm/nexus buildings and a clan owner
        $zones = MapZone::whereNotNull('clan_id')
            ->with(['zoneBuildings', 'clan.members'])
            ->get();

        foreach ($zones as $zone) {
            foreach ($zone->zoneBuildings as $building) {
                $rate = $building->getExtractionRate();
                if ($rate === 0) continue; // defense/watchtower produce nothing

                $config   = $building->getConfig();
                $produces = null;

                if ($building->type === 'extractor') {
                    // Extractors use the zone's primary resource
                    $produces = \App\Models\MapZone::RESOURCE_TO_COLUMN[$zone->resource_primary] ?? null;

                    // Check that there's reserve left
                    if ($zone->reserve_primary <= 0) continue;

                    $actualAmount = min($rate, $zone->reserve_primary);
                    $zone->reserve_primary = max(0, $zone->reserve_primary - $actualAmount);
                    $zone->last_extracted_at = now();
                    $zone->save();

                } elseif ($building->type === 'farm') {
                    $produces     = 'food';
                    $actualAmount = $rate;
                } elseif ($building->type === 'comptoir') {
                    $produces     = 'gold';
                    $actualAmount = $rate;
                } elseif ($building->type === 'sawmill') {
                    $produces     = 'wood';
                    $actualAmount = $rate;
                } else {
                    continue;
                }

                if (!$produces || !isset($actualAmount)) continue;

                // Distribute equally among all clan members
                $members = $zone->clan->members ?? collect();
                if ($members->isEmpty()) continue;

                $perMember = max(1, (int)floor($actualAmount / $members->count()));

                foreach ($members as $member) {
                    DB::table('users')
                        ->where('id', $member->id)
                        ->increment($produces, $perMember);
                }

                $processed++;
            }
        }

        $this->info("Produced resources for {$processed} building(s).");
    }
}
