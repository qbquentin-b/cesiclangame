<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clan_buildings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('clan_id')->index();
            $table->foreign('clan_id')->references('id')->on('clans')->onDelete('cascade');
            $table->string('type'); // farm, mine, power_plant, nexus, fortress, barracks
            $table->integer('level')->default(1);
            // Resources needed to reach next level (accumulated contributions)
            $table->integer('contributed_wood')->default(0);
            $table->integer('contributed_metal')->default(0);
            $table->integer('contributed_energy')->default(0);
            $table->integer('contributed_fragments')->default(0);
            $table->timestamp('last_collected_at')->nullable();
            $table->timestamps();

            $table->unique(['clan_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clan_buildings');
    }
};
