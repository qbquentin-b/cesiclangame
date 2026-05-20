<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('soldier_types', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->integer('attack')->default(0);
            $table->integer('defense')->default(0);
            $table->integer('hp')->default(0);
            $table->integer('cost_wood')->default(0);
            $table->integer('cost_metal')->default(0);
            $table->integer('cost_energy')->default(0);
            $table->integer('cost_fragments')->default(0);
            $table->integer('training_time')->default(60); // seconds
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('soldier_types');
    }
};
