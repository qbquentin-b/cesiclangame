<?php

namespace Database\Seeders;

use App\Models\Hero;
use Illuminate\Database\Seeder;

class HeroSeeder extends Seeder
{
    public function run(): void
    {
        $heroes = [
            // Légendaires
            ['name' => 'Arthas le Maudit',     'emoji' => '💀', 'stat_type' => 'atk', 'stat_value' => 45, 'rarity' => 'legendary'],
            ['name' => 'Séraphine de Lumière',  'emoji' => '✨', 'stat_type' => 'def', 'stat_value' => 42, 'rarity' => 'legendary'],
            ['name' => 'Ragnar le Barbare',     'emoji' => '⚡', 'stat_type' => 'atk', 'stat_value' => 48, 'rarity' => 'legendary'],
            ['name' => 'Isolde la Gardienne',   'emoji' => '🛡️', 'stat_type' => 'def', 'stat_value' => 50, 'rarity' => 'legendary'],
            ['name' => 'Zephyr l\'Ombrefeu',    'emoji' => '🔥', 'stat_type' => 'atk', 'stat_value' => 44, 'rarity' => 'legendary'],

            // Rares
            ['name' => 'Valdris le Forgeron',   'emoji' => '⚒️', 'stat_type' => 'atk', 'stat_value' => 28, 'rarity' => 'rare'],
            ['name' => 'Mira l\'Éclaireuse',    'emoji' => '🏹', 'stat_type' => 'atk', 'stat_value' => 25, 'rarity' => 'rare'],
            ['name' => 'Gorak le Bouclier',     'emoji' => '🛡️', 'stat_type' => 'def', 'stat_value' => 30, 'rarity' => 'rare'],
            ['name' => 'Lysara la Sage',        'emoji' => '📜', 'stat_type' => 'def', 'stat_value' => 27, 'rarity' => 'rare'],
            ['name' => 'Duren le Chasseur',     'emoji' => '🗡️', 'stat_type' => 'atk', 'stat_value' => 26, 'rarity' => 'rare'],
            ['name' => 'Thyra Ventefroide',     'emoji' => '❄️', 'stat_type' => 'def', 'stat_value' => 29, 'rarity' => 'rare'],
        ];

        foreach ($heroes as $data) {
            Hero::firstOrCreate(['name' => $data['name']], $data);
        }

        $this->command->info('HeroSeeder: ' . count($heroes) . ' héros créés.');
    }
}
