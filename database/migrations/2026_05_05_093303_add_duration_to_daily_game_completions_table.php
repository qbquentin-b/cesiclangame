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
        Schema::table('daily_game_completions', function (Blueprint $table) {
            $table->unsignedSmallInteger('duration_seconds')->nullable()->after('completed_at');
        });
    }

    public function down(): void
    {
        Schema::table('daily_game_completions', function (Blueprint $table) {
            $table->dropColumn('duration_seconds');
        });
    }
};
