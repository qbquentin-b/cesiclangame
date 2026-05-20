<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('DELETE FROM building_contributions');

        Schema::table('building_contributions', function (Blueprint $table) {
            $table->integer('crystals')->default(0)->after('fragments');
        });

        Schema::table('clan_buildings', function (Blueprint $table) {
            $table->integer('contributed_crystals')->default(0)->after('contributed_fragments');
        });
    }

    public function down(): void
    {
        Schema::table('building_contributions', function (Blueprint $table) {
            $table->dropColumn('crystals');
        });
        Schema::table('clan_buildings', function (Blueprint $table) {
            $table->dropColumn('contributed_crystals');
        });
    }
};
