<?php

namespace Database\Seeders;

use App\Models\MapZone;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class MapZoneSeeder extends Seeder
{
    public function run(): void
    {
        $zones = $this->generateZones();

        foreach ($zones as $zone) {
            $biome = MapZone::BIOME_RESOURCES[$zone['type']];
            MapZone::create([
                'id'                 => Str::uuid(),
                'x_coord'            => $zone['x'],
                'y_coord'            => $zone['y'],
                'name'               => $zone['name'],
                'type'               => $zone['type'],
                'resource_primary'   => $biome['primary'],
                'resource_secondary' => $biome['secondary'],
                'reserve_primary'    => 400,
                'reserve_secondary'  => 200,
                'reserve_max'        => 400,
                'clan_id'            => null,
                'is_capital'         => false,
            ]);
        }

        $this->command->info('MapZoneSeeder: ' . count($zones) . ' zones créées.');
    }

    private function generateZones(): array
    {
        // 9x9 grid ≈ 81 zones, with jitter inside each cell (cell size ~111px)
        $cols = 9;
        $rows = 9;
        $cellW = 1000 / $cols;
        $cellH = 1000 / $rows;
        $margin = 30; // keep zone seeds away from edges

        $names = $this->zoneNames();
        $shuffle = $names;
        shuffle($shuffle);
        $nameIdx = 0;

        $zones = [];
        for ($row = 0; $row < $rows; $row++) {
            for ($col = 0; $col < $cols; $col++) {
                // Center of cell + deterministic jitter (no rand to keep idempotent)
                $jitterX = sin($col * 7 + $row * 13) * ($cellW * 0.3);
                $jitterY = cos($col * 11 + $row * 5) * ($cellH * 0.3);

                $x = (int) round($cellW * $col + $cellW / 2 + $jitterX);
                $y = (int) round($cellH * $row + $cellH / 2 + $jitterY);

                // Clamp inside map
                $x = max($margin, min(1000 - $margin, $x));
                $y = max($margin, min(1000 - $margin, $y));

                $type = $this->terrainForCell($col, $row, $cols, $rows);
                $name = $shuffle[$nameIdx % count($shuffle)];
                $nameIdx++;

                $zones[] = ['x' => $x, 'y' => $y, 'type' => $type, 'name' => $name];
            }
        }

        return $zones;
    }

    // Assign terrain based on position: mountains at corners/edges, forest upper-mid,
    // desert center-right, plains everywhere else.
    private function terrainForCell(int $col, int $row, int $cols, int $rows): string
    {
        $isTopEdge    = $row <= 1;
        $isBottomEdge = $row >= $rows - 2;
        $isLeftEdge   = $col <= 1;
        $isRightEdge  = $col >= $cols - 2;

        if (($isTopEdge && $isLeftEdge) || ($isTopEdge && $isRightEdge) ||
            ($isBottomEdge && $isLeftEdge) || ($isBottomEdge && $isRightEdge)) {
            return 'mountain';
        }

        if ($isTopEdge || ($row === 1 && ($col >= 2 && $col <= 6))) {
            return 'forest';
        }

        if ($col >= 5 && $row >= 3 && $row <= 6) {
            return 'desert';
        }

        if ($col <= 2 && $row >= 3 && $row <= 6) {
            return 'forest';
        }

        return 'plains';
    }

    private function zoneNames(): array
    {
        return [
            'Aeloria', 'Valdrath', 'Sombrevaux', 'Ferrokhaan', 'Aurimonde',
            'Terrekhal', 'Glacivorn', 'Pyrethis', 'Umbrafeld', 'Solmire',
            'Keldara', 'Vestenmark', 'Ironspire', 'Caldenmoor', 'Duskhollow',
            'Ashenveil', 'Brightmere', 'Thorngate', 'Stonehaven', 'Emberfell',
            'Darkwater', 'Goldshire', 'Frostpeak', 'Silverholm', 'Redcliff',
            'Greystone', 'Blackmoor', 'Dawnreach', 'Starfall', 'Moonvale',
            'Crimsonkeep', 'Oakheart', 'Sandrift', 'Ironwood', 'Mistfall',
            'Stormgate', 'Cinderholm', 'Deepvale', 'Highmoor', 'Swiftbrook',
            'Coldforge', 'Embertide', 'Verdmont', 'Hollowden', 'Ashford',
            'Grimhaven', 'Shademont', 'Fernwick', 'Boulderpass', 'Dustmere',
            'Riverwatch', 'Hillcrest', 'Dunmark', 'Coalvane', 'Saltholm',
            'Lakemoor', 'Peakfall', 'Windvale', 'Starkeep', 'Dawnmere',
            'Hazelveil', 'Cinderkeep', 'Marshgate', 'Stonemark', 'Icefall',
            'Flameholt', 'Woodhaven', 'Darkrift', 'Goldcrest', 'Ravenholm',
            'Cloudpeak', 'Thistledown', 'Ironvale', 'Dusthaven', 'Greenfield',
            'Shadowfen', 'Coppergate', 'Wolfmere', 'Ebonwood', 'Sandholt',
            'Pinewatch', 'Stonebridge', 'Fogmoor', 'Bramblegate', 'Ashcroft',
        ];
    }
}
