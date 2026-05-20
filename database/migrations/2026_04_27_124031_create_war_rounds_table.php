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
        Schema::create('war_rounds', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('war_id')->constrained('wars')->cascadeOnDelete();
            $table->unsignedTinyInteger('round_number');
            $table->string('status')->default('pending'); // pending|active|finished
            $table->timestamp('starts_at');
            $table->timestamp('ends_at');
            $table->integer('score_a')->default(0);
            $table->integer('score_b')->default(0);
            $table->timestamps();
            $table->unique(['war_id', 'round_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('war_rounds');
    }
};
