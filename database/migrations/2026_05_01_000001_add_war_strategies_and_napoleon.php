<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('wars', function (Blueprint $table) {
            $table->string('strategy_a')->nullable()->after('zone_id');
            $table->string('strategy_b')->nullable()->after('strategy_a');
            $table->boolean('napoleon_bonus_used')->default(false)->after('strategy_b');
        });
    }

    public function down(): void
    {
        Schema::table('wars', function (Blueprint $table) {
            $table->dropColumn(['strategy_a', 'strategy_b', 'napoleon_bonus_used']);
        });
    }
};
