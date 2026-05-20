<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class BettingEvent extends Model
{
    use HasUuids;

    protected $fillable = [
        'title',
        'options',
        'status',
        'result',
    ];

    protected function casts(): array
    {
        return [
            'options' => 'array',
        ];
    }
}
