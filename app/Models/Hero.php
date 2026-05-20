<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Hero extends Model
{
    protected $fillable = ['name', 'emoji', 'stat_type', 'stat_value', 'rarity'];

    public function users()
    {
        return $this->belongsToMany(User::class, 'user_heroes')->withPivot('obtained_at')->withTimestamps();
    }
}
