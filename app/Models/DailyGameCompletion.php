<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DailyGameCompletion extends Model
{
    protected $fillable = ['user_id', 'game_type', 'game_date', 'completed_at', 'duration_seconds', 'rank', 'chest_awarded'];

    protected $casts = [
        'game_date'     => 'date',
        'completed_at'  => 'datetime',
        'chest_awarded' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
