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
        Schema::create('legendary_war_clans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('legendary_war_id');
            $table->uuid('clan_id');
            $table->unsignedInteger('score')->default(0);
            $table->unsignedTinyInteger('morale')->default(100);
            $table->unsignedTinyInteger('eliminated_round')->nullable();
            $table->timestamps();

            $table->unique(['legendary_war_id', 'clan_id']);
            $table->foreign('legendary_war_id')->references('id')->on('legendary_wars')->cascadeOnDelete();
            $table->foreign('clan_id')->references('id')->on('clans')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('legendary_war_clans');
    }
};
