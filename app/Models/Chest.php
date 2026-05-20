<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Chest extends Model
{
    protected $fillable = ['user_id', 'chest_type', 'status', 'source', 'contents', 'obtained_at', 'opened_at'];

    protected $casts = [
        'contents'    => 'array',
        'obtained_at' => 'datetime',
        'opened_at'   => 'datetime',
    ];

    const WEIGHTS = ['common' => 70, 'rare' => 25, 'legendary' => 5];

    public static function rollType(): string
    {
        $roll = rand(1, 100);
        if ($roll <= 9)  return 'legendary';
        if ($roll <= 34) return 'rare';
        return 'common';
    }

    public static function rollContents(string $type): array
    {
        // 1 ressource principale tirée au hasard parmi food/wood/metal
        $main = ['food', 'wood', 'metal'][rand(0, 2)];

        return match ($type) {
            'common' => [
                $main      => rand(25, 50),
                'gold'     => rand(0, 1) ? rand(5, 10) : 0, // 50% chance de quelques pièces d'or
                'crystals' => 0,
                'hero'     => null,
            ],
            'rare' => [
                $main      => rand(60, 120),
                'gold'     => rand(10, 25),
                'crystals' => rand(2, 5),
                'hero'     => null,
            ],
            'legendary' => [
                $main      => rand(120, 250),
                'gold'     => rand(30, 60),
                'crystals' => rand(8, 18),
                'hero'     => rand(1, 100) <= 60 ? Hero::inRandomOrder()->value('id') : null,
            ],
            default => [],
        };
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
