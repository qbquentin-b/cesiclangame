<?php

namespace Database\Seeders;

use App\Models\Commander;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CommanderSeeder extends Seeder
{
    public function run(): void
    {
        $commanders = [
            // Légendaires
            [
                'name'         => 'Sun Tzu',
                'slug'         => 'sun_tzu',
                'rarity'       => 'legendary',
                'title'        => 'L\'Art de la Guerre',
                'description'  => '-20% DEF ennemie. Révèle les troupes adverses avant déploiement.',
                'lore'         => '"Connais ton ennemi et connais-toi toi-même ; eussiez-vous cent guerres à soutenir, cent fois vous serez victorieux."',
                'effect_type'  => 'spy_and_debuff',
                'effect_value' => ['enemy_defense_reduction' => 0.20, 'spy' => true],
            ],
            [
                'name'         => 'Napoléon Bonaparte',
                'slug'         => 'napoleon',
                'rarity'       => 'legendary',
                'title'        => 'L\'Empereur',
                'description'  => 'Fantassins +40% ATK. Bonus d\'un slot d\'armée supplémentaire.',
                'lore'         => '"Impossible n\'est pas français."',
                'effect_type'  => 'infantry_boost',
                'effect_value' => ['infantry_atk_bonus' => 0.40, 'extra_army_slots' => 1],
            ],
            // Épiques
            [
                'name'         => 'Alexandre le Grand',
                'slug'         => 'alexandre',
                'rarity'       => 'epic',
                'title'        => 'Le Conquérant',
                'description'  => 'Cavaliers font x2 dégâts lors de la première charge.',
                'lore'         => '"Il n\'est pas de terre infranchissable pour qui veut y planter son étendard."',
                'effect_type'  => 'cavalry_charge',
                'effect_value' => ['cavalry_first_charge_multiplier' => 2.0],
            ],
            [
                'name'         => 'Jeanne d\'Arc',
                'slug'         => 'jeanne_arc',
                'rarity'       => 'epic',
                'title'        => 'La Pucelle d\'Orléans',
                'description'  => 'Bonus moral : +25% ATK pour toutes les troupes quand le clan est en infériorité.',
                'lore'         => '"Je n\'ai point de peur, c\'est ma nature."',
                'effect_type'  => 'underdog_bonus',
                'effect_value' => ['atk_bonus_when_losing' => 0.25],
            ],
            [
                'name'         => 'Gengis Khan',
                'slug'         => 'gengis_khan',
                'rarity'       => 'epic',
                'title'        => 'Khan des Khans',
                'description'  => 'Pillage : vole 15% de ressources supplémentaires en cas de victoire.',
                'lore'         => '"La force n\'est pas dans le nombre, mais dans la volonté."',
                'effect_type'  => 'pillage',
                'effect_value' => ['pillage_bonus' => 0.15],
            ],
            // Rares
            [
                'name'         => 'Jules César',
                'slug'         => 'jules_cesar',
                'rarity'       => 'rare',
                'title'        => 'Imperator',
                'description'  => 'Fantassins forment un mur de boucliers : +30% DEF.',
                'lore'         => '"Veni, vidi, vici."',
                'effect_type'  => 'shield_wall',
                'effect_value' => ['infantry_def_bonus' => 0.30],
            ],
            [
                'name'         => 'Hannibal Barca',
                'slug'         => 'hannibal',
                'rarity'       => 'rare',
                'title'        => 'Le Fléau de Rome',
                'description'  => 'Flanquement : ignore 20% de la DEF adverse.',
                'lore'         => '"Je trouverai un chemin, ou j\'en ferai un."',
                'effect_type'  => 'flanking',
                'effect_value' => ['defense_pierce' => 0.20],
            ],
            [
                'name'         => 'Saladin',
                'slug'         => 'saladin',
                'rarity'       => 'rare',
                'title'        => 'Sultan de l\'Islam',
                'description'  => 'Défense fortifiée : +40% DEF sur les zones conquises.',
                'lore'         => '"La générosité est une vertu, mais la justice est plus grande encore."',
                'effect_type'  => 'fortified_defense',
                'effect_value' => ['defense_on_owned_zone' => 0.40],
            ],
            // Communs
            [
                'name'         => 'Wellington',
                'slug'         => 'wellington',
                'rarity'       => 'common',
                'title'        => 'Le Duc de Fer',
                'description'  => '+20% DEF pour toutes les troupes lorsque le clan est en défense.',
                'lore'         => '"La méthode n\'est rien si l\'audace manque."',
                'effect_type'  => 'defensive_stance',
                'effect_value' => ['def_bonus_defending' => 0.20],
            ],
            [
                'name'         => 'Attila le Hun',
                'slug'         => 'attila',
                'rarity'       => 'common',
                'title'        => 'Le Fléau de Dieu',
                'description'  => 'Furie barbare : +10% ATK aux troupes survivantes après chaque round.',
                'lore'         => '"Là où mon cheval a passé, l\'herbe ne repousse plus."',
                'effect_type'  => 'barbarian_fury',
                'effect_value' => ['atk_bonus_per_round' => 0.10],
            ],
        ];

        foreach ($commanders as $data) {
            Commander::updateOrCreate(
                ['slug' => $data['slug']],
                array_merge($data, ['id' => Str::uuid()])
            );
        }
    }
}
