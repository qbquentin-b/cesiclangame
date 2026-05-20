<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class LegendaryWarClan extends Model
{
    use HasUuids;

    protected $fillable = [
        'legendary_war_id',
        'clan_id',
        'score',
        'morale',
        'eliminated_round',
    ];

    public function clan()
    {
        return $this->belongsTo(Clan::class);
    }

    public function legendaryWar()
    {
        return $this->belongsTo(LegendaryWar::class);
    }

    public function isEliminated(): bool
    {
        return $this->eliminated_round !== null;
    }
}
