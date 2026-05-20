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
        Schema::table('wars', function (Blueprint $table) {
            $table->unsignedTinyInteger('total_rounds')->default(4)->after('score_b');
            $table->unsignedTinyInteger('current_round')->default(0)->after('total_rounds');
            $table->uuid('zone_id')->nullable()->after('current_round');
        });
    }

    public function down(): void
    {
        Schema::table('wars', function (Blueprint $table) {
            $table->dropColumn(['total_rounds', 'current_round', 'zone_id']);
        });
    }
};
