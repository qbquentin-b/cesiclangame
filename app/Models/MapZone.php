<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MapZone extends Model
{
    use HasFactory, HasUuids;

    protected $guarded = [];

    protected $casts = [
        'is_capital'        => 'boolean',
        'last_extracted_at' => 'datetime',
        'conquest_started_at' => 'datetime',
    ];

    // Biome to resource mapping
    const BIOME_RESOURCES = [
        'plains'   => ['primary' => 'food',  'secondary' => 'wood',  'primary_label' => '🌾 Nourriture', 'secondary_label' => '🪵 Bois'],
        'forest'   => ['primary' => 'wood',  'secondary' => 'food',  'primary_label' => '🪵 Bois',        'secondary_label' => '🌾 Nourriture'],
        'mountain' => ['primary' => 'metal', 'secondary' => 'gold',  'primary_label' => '⚙️ Fer',          'secondary_label' => '🪙 Or'],
        'desert'   => ['primary' => 'gold',  'secondary' => 'food',  'primary_label' => '🪙 Or',           'secondary_label' => '🌾 Nourriture'],
    ];

    // Map resource types to user inventory columns (1:1 now)
    const RESOURCE_TO_COLUMN = [
        'food'  => 'food',
        'wood'  => 'wood',
        'metal' => 'metal',
        'gold'  => 'gold',
    ];

    public function clan()
    {
        return $this->belongsTo(Clan::class);
    }

    public function conqueringClan()
    {
        return $this->belongsTo(Clan::class, 'conquering_clan_id');
    }

    public function zoneBuildings()
    {
        return $this->hasMany(ZoneBuilding::class, 'zone_id');
    }

    public function getReservePct(): int
    {
        if (!$this->reserve_max || $this->reserve_max === 0) return 0;
        return (int)round(($this->reserve_primary / $this->reserve_max) * 100);
    }

    public function getBiomeLabel(): array
    {
        return self::BIOME_RESOURCES[$this->type] ?? ['primary' => 'food', 'secondary' => null, 'primary_label' => '🌾', 'secondary_label' => null];
    }
}
