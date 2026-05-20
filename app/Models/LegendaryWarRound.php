<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class LegendaryWarRound extends Model
{
    use HasUuids;

    protected $fillable = [
        'legendary_war_id',
        'round_number',
        'status',
        'starts_at',
        'ends_at',
        'eliminated_clan_id',
        'clan_scores',
    ];

    protected $casts = [
        'starts_at'   => 'datetime',
        'ends_at'     => 'datetime',
        'clan_scores' => 'array',
    ];

    public function legendaryWar()
    {
        return $this->belongsTo(LegendaryWar::class);
    }

    public function actions()
    {
        return $this->hasMany(LegendaryWarAction::class, 'legendary_war_round_id');
    }
}
