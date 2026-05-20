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
        Schema::create('legendary_war_actions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('legendary_war_id');
            $table->uuid('legendary_war_round_id');
            $table->uuid('user_id');
            $table->uuid('clan_id');
            $table->string('tactic');
            $table->json('troops');
            $table->unsignedInteger('contribution_score')->default(0);
            $table->json('troops_lost')->nullable();
            $table->timestamps();

            $table->index('legendary_war_id');
            $table->index('legendary_war_round_id');
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('legendary_war_actions');
    }
};
