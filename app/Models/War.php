<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use App\Models\Clan;

class War extends Model
{
    use HasUuids;

    protected $fillable = [
        'clan_a_id',
        'clan_b_id',
        'scheduled_at',
        'status',
        'winner_id',
        'score_a',
        'score_b',
        'total_rounds',
        'current_round',
        'zone_id',
        'strategy_a',
        'strategy_b',
        'napoleon_bonus_used',
        'morale_a',
        'morale_b',
    ];

    protected $casts = [
        'napoleon_bonus_used' => 'boolean',
        'scheduled_at'        => 'datetime',
        'morale_a'            => 'integer',
        'morale_b'            => 'integer',
    ];

    public function clanA()
    {
        return $this->belongsTo(Clan::class, 'clan_a_id');
    }

    public function clanB()
    {
        return $this->belongsTo(Clan::class, 'clan_b_id');
    }

    public function deployments()
    {
        return $this->hasMany(WarDeployment::class);
    }

    public function rounds()
    {
        return $this->hasMany(WarRound::class)->orderBy('round_number');
    }
}
