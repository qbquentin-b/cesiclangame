<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class BuildingContribution extends Model
{
    use HasUuids;

    protected $guarded = [];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function building()
    {
        return $this->belongsTo(ClanBuilding::class, 'building_id');
    }
}
