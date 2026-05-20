<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('blackjack_players', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('table_id')->constrained('blackjack_tables')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->json('hand')->nullable();
            $table->unsignedInteger('bet')->default(0);
            $table->string('status')->default('waiting'); // waiting, bet_placed, playing, standing, busted, blackjack, won, lost, push
            $table->unsignedTinyInteger('seat')->default(0);
            $table->timestamps();
            $table->unique(['table_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blackjack_players');
    }
};
