<?php

namespace Database\Seeders;

use App\Models\SoldierType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SoldierTypeSeeder extends Seeder
{
    public function run(): void
    {
        $soldiers = [
            [
                'name'          => 'Éclaireur',
                'slug'          => 'eclaireur',
                'attack'        => 10,
                'defense'       => 5,
                'hp'            => 30,
                'cost_wood'     => 10,
                'cost_metal'    => 0,
                'cost_food'     => 30,
                'cost_gold'     => 0,
                'training_time' => 30,
                'description'   => 'Unité légère et rapide. Nourrie et équipée d\'un arc simple.',
            ],
            [
                'name'          => 'Fantassin',
                'slug'          => 'fantassin',
                'attack'        => 20,
                'defense'       => 20,
                'hp'            => 60,
                'cost_wood'     => 0,
                'cost_metal'    => 15,
                'cost_food'     => 30,
                'cost_gold'     => 0,
                'training_time' => 60,
                'description'   => 'Soldat polyvalent armé de fer. Épine dorsale de toute armée.',
            ],
            [
                'name'          => 'Archer',
                'slug'          => 'archer',
                'attack'        => 35,
                'defense'       => 8,
                'hp'            => 45,
                'cost_wood'     => 20,
                'cost_metal'    => 0,
                'cost_food'     => 25,
                'cost_gold'     => 0,
                'training_time' => 90,
                'description'   => 'Arc en bois de qualité. Frappe à distance, fragile en mêlée.',
            ],
            [
                'name'          => 'Cavalier',
                'slug'          => 'cavalier',
                'attack'        => 45,
                'defense'       => 25,
                'hp'            => 90,
                'cost_wood'     => 0,
                'cost_metal'    => 30,
                'cost_food'     => 50,
                'cost_gold'     => 20,
                'training_time' => 150,
                'description'   => 'Cheval, armure et solde en or. Puissance de choc redoutable.',
            ],
            [
                'name'          => 'Catapulte',
                'slug'          => 'catapulte',
                'attack'        => 60,
                'defense'       => 5,
                'hp'            => 40,
                'cost_wood'     => 40,
                'cost_metal'    => 40,
                'cost_food'     => 0,
                'cost_gold'     => 20,
                'training_time' => 300,
                'description'   => 'Machine de siège en bois et fer. Détruit les défenses, inutile seule.',
            ],
        ];

        foreach ($soldiers as $data) {
            SoldierType::updateOrCreate(['slug' => $data['slug']], array_merge($data, ['id' => Str::uuid()]));
        }
    }
}
