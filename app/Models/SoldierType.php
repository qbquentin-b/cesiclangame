<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class SoldierType extends Model
{
    use HasUuids;

    protected $fillable = [
        'name', 'slug', 'attack', 'defense', 'hp',
        'cost_wood', 'cost_metal', 'cost_food', 'cost_gold',
        'training_time', 'description',
    ];

    public function userTroops()
    {
        return $this->hasMany(UserTroop::class);
    }
}
