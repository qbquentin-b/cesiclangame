<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('war_round_actions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('war_id')->constrained('wars')->cascadeOnDelete();
            $table->uuid('war_round_id');
            $table->foreign('war_round_id')->references('id')->on('war_rounds')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('clan_id');
            // frontal_attack|echelon_defense|targeted_strike|tactical_retreat|final_push
            $table->string('tactic');
            $table->json('troops'); // {soldier_type_id: qty}
            $table->integer('contribution_score')->default(0);
            $table->json('troops_lost')->nullable(); // filled after round resolves
            $table->timestamps();
            $table->unique(['war_round_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('war_round_actions');
    }
};
