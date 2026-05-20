<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('blackjack_tables', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('status')->default('waiting'); // waiting, betting, playing, dealer_turn, finished
            $table->json('deck')->nullable();
            $table->json('dealer_hand')->nullable();
            $table->unsignedTinyInteger('max_players')->default(4);
            $table->unsignedTinyInteger('current_seat')->default(0);
            $table->foreignUuid('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamp('last_action_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blackjack_tables');
    }
};
