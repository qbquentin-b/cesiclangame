<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MarketOffer extends Model
{
    use HasFactory, HasUuids;

    protected $guarded = [];

    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id');
    }
}
