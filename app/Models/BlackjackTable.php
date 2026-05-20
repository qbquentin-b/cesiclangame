<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class BlackjackTable extends Model
{
    use HasUuids;

    protected $table = 'blackjack_tables';

    protected $fillable = [
        'status',
        'deck',
        'dealer_hand',
        'max_players',
        'current_seat',
        'created_by',
        'last_action_at',
    ];

    protected $casts = [
        'deck'           => 'array',
        'dealer_hand'    => 'array',
        'last_action_at' => 'datetime',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function players()
    {
        return $this->hasMany(BlackjackPlayer::class, 'table_id')->orderBy('seat');
    }
}
