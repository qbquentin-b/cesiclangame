<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class LegendaryWarAction extends Model
{
    use HasUuids;

    protected $fillable = [
        'legendary_war_id',
        'legendary_war_round_id',
        'user_id',
        'clan_id',
        'tactic',
        'troops',
        'contribution_score',
        'troops_lost',
    ];

    protected $casts = [
        'troops'      => 'array',
        'troops_lost' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
