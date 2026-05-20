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
        Schema::create('heroes', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('emoji', 8)->default('⚔️');
            $table->enum('stat_type', ['atk', 'def']);
            $table->unsignedSmallInteger('stat_value');
            $table->enum('rarity', ['rare', 'legendary'])->default('rare');
            $table->timestamps();
        });

        Schema::create('user_heroes', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('hero_id')->constrained()->cascadeOnDelete();
            $table->timestamp('obtained_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_heroes');
        Schema::dropIfExists('heroes');
    }
};
