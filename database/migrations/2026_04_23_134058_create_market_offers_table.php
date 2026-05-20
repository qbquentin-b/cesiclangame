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
        Schema::create('market_offers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('seller_id')->index();
            $table->foreign('seller_id')->references('id')->on('users')->cascadeOnDelete();
            
            // What the seller is giving
            $table->string('offer_type'); // 'crystals' or 'resource_{type}'
            $table->integer('offer_amount');

            // What the seller wants
            $table->string('wanted_type'); 
            $table->integer('wanted_amount');

            // Status: open, completed, cancelled
            $table->string('status')->default('open');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('market_offers');
    }
};
