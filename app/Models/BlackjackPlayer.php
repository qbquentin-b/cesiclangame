<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class BlackjackPlayer extends Model
{
    use HasUuids;

    protected $table = 'blackjack_players';

    protected $fillable = [
        'table_id',
        'user_id',
        'hand',
        'bet',
        'status',
        'seat',
    ];

    protected $casts = [
        'hand' => 'array',
    ];

    public function blackjackTable()
    {
        return $this->belongsTo(BlackjackTable::class, 'table_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
