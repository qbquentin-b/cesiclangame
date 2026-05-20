<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class WarRound extends Model
{
    use HasUuids;

    protected $fillable = [
        'war_id', 'round_number', 'status', 'starts_at', 'ends_at', 'score_a', 'score_b',
    ];

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at'   => 'datetime',
    ];

    public function war()
    {
        return $this->belongsTo(War::class);
    }

    public function actions()
    {
        return $this->hasMany(WarRoundAction::class);
    }
}
