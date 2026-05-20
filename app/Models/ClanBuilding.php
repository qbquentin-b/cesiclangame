<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ClanBuilding extends Model
{
    use HasUuids;

    protected $guarded = [];

    protected $casts = [
        'last_collected_at' => 'datetime',
    ];

    // Each building type config: label, icon, production resource, production per hour by level
    // upgrade_cost format: [wood, metal, food, gold, crystals]
    // Level 1→2: crystals only. From level 2 onwards: ×1.4 per level.
    const BUILDINGS_CONFIG = [
        'farm' => [
            'label'      => 'Ferme',
            'icon'       => '🌾',
            'produces'   => 'food',
            // production/h par niveau (index = niveau)
            'production' => [0, 20, 40, 70, 110, 160, 225, 310, 425, 580, 790],
            'upgrade_cost' => [
                1 => [0,    0,   0,   0,   100],
                2 => [0,    70,  14,  0,   0],
                3 => [0,    140, 28,  7,   0],
                4 => [0,    280, 56,  21,  0],
                5 => [0,    390, 78,  29,  0],
                6 => [0,    545, 110, 41,  0],
                7 => [0,    765, 154, 57,  0],
                8 => [0,    1070, 215, 80, 0],
                9 => [0,    1500, 300, 112, 0],
                10 => null,
            ],
        ],
        'mine' => [
            'label'      => 'Mine',
            'icon'       => '⛏️',
            'produces'   => 'metal',
            'production' => [0, 15, 30, 55, 85, 120, 170, 235, 330, 460, 645],
            'upgrade_cost' => [
                1 => [0,    0,   0,   0,  100],
                2 => [50,   0,   10,  0,  0],
                3 => [100,  0,   20,  5,  0],
                4 => [200,  0,   40,  15, 0],
                5 => [280,  0,   56,  21, 0],
                6 => [390,  0,   78,  29, 0],
                7 => [545,  0,   110, 41, 0],
                8 => [765,  0,   154, 57, 0],
                9 => [1070, 0,   215, 80, 0],
                10 => null,
            ],
        ],
        'sawmill' => [
            'label'      => 'Scierie',
            'icon'       => '🪵',
            'produces'   => 'wood',
            'production' => [0, 10, 22, 40, 65, 95, 133, 185, 260, 365, 510],
            'upgrade_cost' => [
                1 => [0,    0,   0,   0,   120],
                2 => [0,    25,  50,  0,   0],
                3 => [0,    50,  90,  10,  0],
                4 => [0,    100, 180, 20,  0],
                5 => [0,    140, 250, 28,  0],
                6 => [0,    195, 350, 39,  0],
                7 => [0,    275, 490, 55,  0],
                8 => [0,    385, 685, 77,  0],
                9 => [0,    540, 960, 108, 0],
                10 => null,
            ],
        ],
        'market' => [
            'label'      => 'Comptoir',
            'icon'       => '🪙',
            'produces'   => 'gold',
            'production' => [0, 5, 12, 20, 35, 50, 70, 98, 137, 192, 270],
            'upgrade_cost' => [
                1 => [0,    0,   0,   0,  150],
                2 => [70,   50,  25,  0,  0],
                3 => [130,  90,  50,  0,  0],
                4 => [250,  150, 100, 0,  0],
                5 => [350,  210, 140, 0,  0],
                6 => [490,  295, 196, 0,  0],
                7 => [685,  415, 275, 0,  0],
                8 => [960,  580, 385, 0,  0],
                9 => [1345, 810, 540, 0,  0],
                10 => null,
            ],
        ],
        'fortress' => [
            'label'      => 'Forteresse',
            'icon'       => '🏰',
            'produces'   => null,
            'production' => [0, 5, 12, 22, 35, 50, 60, 70, 82, 95, 110],
            'upgrade_cost' => [
                1 => [0,    0,    0,   0,   200],
                2 => [100,  70,   40,  15,  0],
                3 => [200,  130,  80,  30,  0],
                4 => [400,  250,  150, 60,  0],
                5 => [560,  350,  210, 84,  0],
                6 => [785,  490,  295, 118, 0],
                7 => [1100, 685,  415, 165, 0],
                8 => [1540, 960,  580, 231, 0],
                9 => [2155, 1345, 810, 323, 0],
                10 => null,
            ],
        ],
        'barracks' => [
            'label'      => 'Caserne',
            'icon'       => '🏹',
            'produces'   => null,
            'production' => [0, 5, 12, 22, 35, 50, 60, 70, 82, 95, 110],
            'upgrade_cost' => [
                1 => [0,    0,    0,   0,   200],
                2 => [90,   90,   40,  15,  0],
                3 => [180,  180,  80,  30,  0],
                4 => [350,  350,  150, 60,  0],
                5 => [490,  490,  210, 84,  0],
                6 => [685,  685,  295, 118, 0],
                7 => [960,  960,  415, 165, 0],
                8 => [1345, 1345, 580, 231, 0],
                9 => [1880, 1880, 810, 323, 0],
                10 => null,
            ],
        ],
    ];

    const MAX_LEVEL = 10;

    public function clan()
    {
        return $this->belongsTo(Clan::class);
    }

    public function contributions()
    {
        return $this->hasMany(BuildingContribution::class, 'building_id')->latest()->limit(20);
    }

    public function getConfig(): array
    {
        return self::BUILDINGS_CONFIG[$this->type] ?? [];
    }

    public function getUpgradeCost(): ?array
    {
        $config = $this->getConfig();
        return $config['upgrade_cost'][$this->level] ?? null;
    }

    public function getProductionPerHour(): int
    {
        $config = $this->getConfig();
        return $config['production'][$this->level] ?? 0;
    }

    public function isMaxLevel(): bool
    {
        return $this->level >= self::MAX_LEVEL;
    }

    // Check if accumulated contributions meet the upgrade threshold
    public function isReadyToUpgrade(): bool
    {
        $cost = $this->getUpgradeCost();
        if (!$cost) return false;
        [$wood, $metal, $food, $gold, $crystals] = array_pad($cost, 5, 0);
        return $this->contributed_wood      >= $wood
            && $this->contributed_metal     >= $metal
            && $this->contributed_food      >= $food
            && $this->contributed_gold      >= $gold
            && $this->contributed_crystals  >= $crystals;
    }
}
