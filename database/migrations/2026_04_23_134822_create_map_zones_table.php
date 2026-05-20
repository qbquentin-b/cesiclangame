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
        Schema::create('map_zones', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->integer('x_coord');
            $table->integer('y_coord');
            $table->string('name');
            $table->string('type')->default('plains'); // plains, forest, mountain, desert
            $table->uuid('clan_id')->nullable()->index();
            $table->foreign('clan_id')->references('id')->on('clans')->nullOnDelete();
            $table->boolean('is_capital')->default(false);
            $table->timestamps();
            
            $table->unique(['x_coord', 'y_coord']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('map_zones');
    }
};
