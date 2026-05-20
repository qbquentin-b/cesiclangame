<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class WarRoundAction extends Model
{
    use HasUuids;

    protected $fillable = [
        'war_id', 'war_round_id', 'user_id', 'clan_id',
        'tactic', 'troops', 'contribution_score', 'troops_lost',
    ];

    protected $casts = [
        'troops'      => 'array',
        'troops_lost' => 'array',
    ];

    public function war()
    {
        return $this->belongsTo(War::class);
    }

    public function round()
    {
        return $this->belongsTo(WarRound::class, 'war_round_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function clan()
    {
        return $this->belongsTo(Clan::class);
    }
}
