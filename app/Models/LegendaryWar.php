<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class LegendaryWar extends Model
{
    use HasUuids;

    protected $fillable = [
        'status',
        'total_rounds',
        'current_round',
        'winner_clan_id',
        'scheduled_at',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
    ];

    public function participants()
    {
        return $this->hasMany(LegendaryWarClan::class)->with('clan');
    }

    public function rounds()
    {
        return $this->hasMany(LegendaryWarRound::class)->orderBy('round_number');
    }

    public function actions()
    {
        return $this->hasMany(LegendaryWarAction::class);
    }

    public function winnerClan()
    {
        return $this->belongsTo(Clan::class, 'winner_clan_id');
    }
}
