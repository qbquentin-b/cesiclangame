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
        Schema::create('daily_game_completions', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->enum('game_type', ['queens', 'tango', 'zip', 'patches']);
            $table->date('game_date');
            $table->timestamp('completed_at');
            $table->unsignedSmallInteger('rank')->nullable();
            $table->boolean('chest_awarded')->default(false);
            $table->timestamps();

            $table->unique(['user_id', 'game_type', 'game_date']);
            $table->index(['game_type', 'game_date', 'completed_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_game_completions');
    }
};
