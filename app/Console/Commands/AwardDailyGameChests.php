<?php

namespace App\Console\Commands;

use App\Models\Chest;
use App\Models\DailyGameCompletion;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class AwardDailyGameChests extends Command
{
    protected $signature   = 'daily-games:award-chests';
    protected $description = 'Attribue les coffres aux top 3 de chaque jeu quotidien (J-1, lancé à 9h)';

    private const GAME_TYPES = ['queens', 'tango', 'zip', 'patches'];

    public function handle(): void
    {
        $yesterday = Carbon::yesterday()->toDateString();

        foreach (self::GAME_TYPES as $type) {
            // Recalculer le classement final par durée puis par heure de complétion
            $completions = DailyGameCompletion::where('game_type', $type)
                ->where('game_date', $yesterday)
                ->where('chest_awarded', false)
                ->orderByRaw('duration_seconds IS NULL ASC')
                ->orderBy('duration_seconds')
                ->orderBy('completed_at')
                ->get();

            foreach ($completions as $index => $completion) {
                $finalRank = $index + 1;
                $completion->update(['rank' => $finalRank]);

                if ($finalRank <= 3) {
                    $chestType = Chest::rollType();
                    Chest::create([
                        'user_id'     => $completion->user_id,
                        'chest_type'  => $chestType,
                        'status'      => 'unopened',
                        'source'      => 'game',
                        'obtained_at' => now(),
                    ]);
                    $completion->update(['chest_awarded' => true]);

                    $this->info("Coffre {$chestType} → user #{$completion->user_id} (rang {$finalRank}, {$type})");
                }
            }
        }

        $this->info('Attribution des coffres quotidiens terminée.');
    }
}
