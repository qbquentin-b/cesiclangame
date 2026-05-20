<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ZoneBuilding extends Model
{
    use HasUuids;

    protected $guarded = [];

    // Max building slots per zone
    const MAX_SLOTS = 2;

    // Available building types, their costs (wood, metal, food, gold), and what they do
    const TYPES = [
        'extractor' => [
            'label'         => 'Extracteur',
            'icon'          => '⛏️',
            'description'   => 'Extrait la ressource principale du biome automatiquement.',
            'cost'          => [0, 30, 20, 0],  // [wood, metal, food, gold] at level 1
            'extracts_rate' => [0, 10, 22, 40], // units/hour by level (index=level)
        ],
        'farm' => [
            'label'         => 'Ferme',
            'icon'          => '🌾',
            'description'   => 'Produit de la nourriture quelle que soit la zone.',
            'cost'          => [10, 0, 0, 0],
            'extracts_rate' => [0, 8, 18, 32],
        ],
        'defense' => [
            'label'         => 'Fortification',
            'icon'          => '🛡️',
            'description'   => 'Augmente la résistance à la conquête ennemie (+15% par niveau).',
            'cost'          => [20, 20, 10, 0],
            'extracts_rate' => [0, 0, 0, 0],
        ],
        'watchtower' => [
            'label'         => 'Tour de Guet',
            'icon'          => '🗼',
            'description'   => 'Révèle les mouvements ennemis et réduit le temps de conquête ennemi.',
            'cost'          => [10, 20, 5, 0],
            'extracts_rate' => [0, 0, 0, 0],
        ],
        'comptoir' => [
            'label'         => 'Comptoir Commercial',
            'icon'          => '🪙',
            'description'   => 'Génère de l\'or grâce au commerce sur la route.',
            'cost'          => [10, 10, 0, 0],
            'extracts_rate' => [0, 5, 12, 22],
        ],
    ];

    const MAX_LEVEL = 3;

    // Upgrade costs multiplier per level
    const UPGRADE_MULTIPLIERS = [1, 1, 2.5, 5];

    public function zone()
    {
        return $this->belongsTo(MapZone::class, 'zone_id');
    }

    public function clan()
    {
        return $this->belongsTo(Clan::class);
    }

    public function getConfig(): array
    {
        return self::TYPES[$this->type] ?? [];
    }

    public function getLabel(): string
    {
        return self::TYPES[$this->type]['label'] ?? $this->type;
    }

    public function getIcon(): string
    {
        return self::TYPES[$this->type]['icon'] ?? '🏗️';
    }

    public function getExtractionRate(): int
    {
        return self::TYPES[$this->type]['extracts_rate'][$this->level] ?? 0;
    }

    public function getUpgradeCost(): ?array
    {
        if ($this->level >= self::MAX_LEVEL) return null;
        $base       = self::TYPES[$this->type]['cost'] ?? [0, 0, 0, 0];
        $multiplier = self::UPGRADE_MULTIPLIERS[$this->level] ?? 1;
        return array_map(fn($v) => (int)ceil($v * $multiplier), $base);
    }
}
