<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('map_zones', function (Blueprint $table) {
            $table->uuid('conquering_clan_id')->nullable()->after('clan_id');
            $table->timestamp('conquest_started_at')->nullable()->after('conquering_clan_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('map_zones', function (Blueprint $table) {
            $table->dropColumn(['conquering_clan_id', 'conquest_started_at']);
        });
    }
};
