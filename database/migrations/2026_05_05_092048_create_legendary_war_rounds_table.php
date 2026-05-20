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
        Schema::create('legendary_war_rounds', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('legendary_war_id');
            $table->unsignedTinyInteger('round_number');
            $table->string('status')->default('pending'); // pending, active, finished
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->uuid('eliminated_clan_id')->nullable();
            $table->json('clan_scores')->nullable();
            $table->timestamps();

            $table->foreign('legendary_war_id')->references('id')->on('legendary_wars')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('legendary_war_rounds');
    }
};
