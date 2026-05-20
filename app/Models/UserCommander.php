<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class UserCommander extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id', 'commander_id', 'is_active', 'obtained_at',
    ];

    protected $casts = [
        'is_active'   => 'boolean',
        'obtained_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function commander()
    {
        return $this->belongsTo(Commander::class);
    }
}
