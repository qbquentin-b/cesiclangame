<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class WarDeployment extends Model
{
    use HasUuids;

    protected $fillable = [
        'war_id', 'user_id', 'clan_id', 'commander_id', 'troops', 'contribution_score',
    ];

    protected $casts = [
        'troops' => 'array',
    ];

    public function war()
    {
        return $this->belongsTo(War::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function clan()
    {
        return $this->belongsTo(Clan::class);
    }

    public function commander()
    {
        return $this->belongsTo(Commander::class);
    }
}
