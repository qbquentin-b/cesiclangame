<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Rename user resource columns: energy→food, fragments→gold
        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('energy', 'food');
            $table->renameColumn('fragments', 'gold');
        });

        // Rename clan_buildings contribution columns
        Schema::table('clan_buildings', function (Blueprint $table) {
            $table->renameColumn('contributed_energy', 'contributed_food');
            $table->renameColumn('contributed_fragments', 'contributed_gold');
        });

        // Rename building_contributions columns
        Schema::table('building_contributions', function (Blueprint $table) {
            $table->renameColumn('energy', 'food');
            $table->renameColumn('fragments', 'gold');
        });

        // Rename soldier_types cost columns
        Schema::table('soldier_types', function (Blueprint $table) {
            $table->renameColumn('cost_energy', 'cost_food');
            $table->renameColumn('cost_fragments', 'cost_gold');
        });

        // Update building type slugs: power_plant→sawmill, nexus→market
        DB::table('clan_buildings')->where('type', 'power_plant')->update(['type' => 'sawmill']);
        DB::table('clan_buildings')->where('type', 'nexus')->update(['type' => 'market']);
    }

    public function down(): void
    {
        DB::table('clan_buildings')->where('type', 'sawmill')->update(['type' => 'power_plant']);
        DB::table('clan_buildings')->where('type', 'market')->update(['type' => 'nexus']);

        Schema::table('soldier_types', function (Blueprint $table) {
            $table->renameColumn('cost_food', 'cost_energy');
            $table->renameColumn('cost_gold', 'cost_fragments');
        });

        Schema::table('building_contributions', function (Blueprint $table) {
            $table->renameColumn('food', 'energy');
            $table->renameColumn('gold', 'fragments');
        });

        Schema::table('clan_buildings', function (Blueprint $table) {
            $table->renameColumn('contributed_food', 'contributed_energy');
            $table->renameColumn('contributed_gold', 'contributed_fragments');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('food', 'energy');
            $table->renameColumn('gold', 'fragments');
        });
    }
};
