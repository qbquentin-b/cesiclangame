<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class UserTroop extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id', 'soldier_type_id', 'quantity', 'wounded', 'healed_at', 'in_training', 'training_done_at',
    ];

    protected $casts = [
        'training_done_at' => 'datetime',
        'healed_at'        => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function soldierType()
    {
        return $this->belongsTo(SoldierType::class);
    }

    public function isTrainingComplete(): bool
    {
        return $this->in_training > 0
            && $this->training_done_at !== null
            && $this->training_done_at->isPast();
    }
}
