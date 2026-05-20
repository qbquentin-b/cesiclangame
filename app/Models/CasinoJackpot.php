<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CasinoJackpot extends Model
{
    protected $table = 'casino_jackpot';

    protected $fillable = [
        'amount',
    ];
}
