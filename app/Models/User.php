<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasUuids;

    protected $fillable = [
        'username',
        'email',
        'password',
        'crystals',
        'war_points',
        'slot_free_spins',
        'clan_id',
        'clan_rank',
        'level',
        'global_rank',
        'is_admin',
        'wood',
        'metal',
        'food',
        'gold',
        'last_seen_at',
    ];

    protected $casts = [
        'last_seen_at' => 'datetime',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function clan()
    {
        return $this->belongsTo(Clan::class);
    }

    public function troops()
    {
        return $this->hasMany(UserTroop::class)->with('soldierType');
    }

    public function commanders()
    {
        return $this->hasMany(UserCommander::class)->with('commander');
    }

    public function activeCommander()
    {
        return $this->hasOne(UserCommander::class)->where('is_active', true)->with('commander');
    }

    public function warDeployments()
    {
        return $this->hasMany(WarDeployment::class);
    }
}
