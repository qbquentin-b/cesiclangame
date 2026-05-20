<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('building_contributions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->index();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->uuid('building_id')->index();
            $table->foreign('building_id')->references('id')->on('clan_buildings')->onDelete('cascade');
            $table->integer('wood')->default(0);
            $table->integer('metal')->default(0);
            $table->integer('energy')->default(0);
            $table->integer('fragments')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('building_contributions');
    }
};
