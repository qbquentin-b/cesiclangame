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
            $table->unsignedTinyInteger('morale_a')->default(100)->after('strategy_b');
            $table->unsignedTinyInteger('morale_b')->default(100)->after('morale_a');
        });
    }

    public function down(): void
    {
        Schema::table('wars', function (Blueprint $table) {
            $table->dropColumn(['morale_a', 'morale_b']);
        });
    }
};
