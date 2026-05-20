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
        Schema::create('legendary_wars', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('status')->default('pending'); // pending, active, finished
            $table->unsignedTinyInteger('total_rounds')->default(4);
            $table->unsignedTinyInteger('current_round')->default(1);
            $table->uuid('winner_clan_id')->nullable();
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('legendary_wars');
    }
};
