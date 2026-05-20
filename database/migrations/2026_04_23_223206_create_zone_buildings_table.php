<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('zone_buildings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('zone_id')->index();
            $table->foreign('zone_id')->references('id')->on('map_zones')->onDelete('cascade');
            $table->uuid('clan_id')->index();
            $table->foreign('clan_id')->references('id')->on('clans')->onDelete('cascade');
            $table->string('type'); // extractor, farm, defense, watchtower, nexus
            $table->integer('level')->default(1);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('zone_buildings');
    }
};
