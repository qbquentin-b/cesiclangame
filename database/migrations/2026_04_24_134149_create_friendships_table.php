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
        Schema::create('friendships', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('requester_id')->index();
            $table->foreign('requester_id')->references('id')->on('users')->onDelete('cascade');
            $table->uuid('addressee_id')->index();
            $table->foreign('addressee_id')->references('id')->on('users')->onDelete('cascade');
            $table->string('status')->default('pending'); // pending | accepted | declined
            $table->timestamps();
            $table->unique(['requester_id', 'addressee_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('friendships');
    }
};
