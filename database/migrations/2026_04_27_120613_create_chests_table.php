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
        Schema::create('chests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('chest_type', ['common', 'rare', 'legendary']);
            $table->enum('status', ['unopened', 'opened'])->default('unopened');
            $table->string('source')->default('game'); // game, admin
            $table->json('contents')->nullable(); // filled on open
            $table->timestamp('obtained_at');
            $table->timestamp('opened_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chests');
    }
};
