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
        Schema::create('betting_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->json('options')->nullable();
            $table->string('status')->default('open'); // open, resolved, cancelled
            $table->string('result')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('betting_events');
    }
};
