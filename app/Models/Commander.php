<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Commander extends Model
{
    use HasUuids;

    protected $fillable = [
        'name', 'slug', 'rarity', 'title', 'description',
        'lore', 'effect_type', 'effect_value', 'image_url',
    ];

    protected $casts = [
        'effect_value' => 'array',
    ];

    public function userCommanders()
    {
        return $this->hasMany(UserCommander::class);
    }
}
