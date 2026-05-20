<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commanders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->enum('rarity', ['common', 'rare', 'epic', 'legendary']);
            $table->string('title')->nullable();
            $table->text('description');
            $table->text('lore')->nullable();
            $table->string('effect_type');
            $table->json('effect_value');
            $table->string('image_url')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commanders');
    }
};
