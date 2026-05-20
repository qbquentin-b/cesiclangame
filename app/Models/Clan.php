<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use App\Models\ClanBuilding;
use App\Models\MapZone;
use App\Models\War;

class Clan extends Model
{
    use HasUuids;

    protected $fillable = [
        'name',
        'color',
        'crest_url',
        'banner_url',
        'crystals_pool',
        'level',
        'tier',
        'power_score',
    ];

    private const LEVEL_THRESHOLDS = [
        10 => 48000,
        9  => 24000,
        8  => 12000,
        7  => 6000,
        6  => 3000,
        5  => 1500,
        4  => 700,
        3  => 300,
        2  => 100,
        1  => 0,
    ];

    public function members()
    {
        return $this->hasMany(User::class);
    }

    public function recalculate(): void
    {
        $buildingScore = ClanBuilding::where('clan_id', $this->id)->sum('level') * 10;
        $zoneScore     = MapZone::where('clan_id', $this->id)->count() * 20;
        $warsWon       = War::where('winner_id', $this->id)->count() * 50;

        $power = $buildingScore + $zoneScore + $warsWon;

        $level = 1;
        foreach (self::LEVEL_THRESHOLDS as $lvl => $threshold) {
            if ($power >= $threshold) {
                $level = $lvl;
                break;
            }
        }

        $tier = match (true) {
            $level >= 10 => 'Diamond',
            $level >= 7  => 'Gold',
            $level >= 4  => 'Silver',
            default      => 'Bronze',
        };

        $this->update([
            'power_score' => $power,
            'level'       => $level,
            'tier'        => $tier,
        ]);
    }
}
