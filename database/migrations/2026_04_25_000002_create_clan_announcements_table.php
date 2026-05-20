<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clan_announcements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('clan_id');
            $table->uuid('sender_id');
            $table->string('title', 100);
            $table->text('body');
            $table->timestamps();

            $table->foreign('clan_id')->references('id')->on('clans')->onDelete('cascade');
            $table->foreign('sender_id')->references('id')->on('users')->onDelete('cascade');
            $table->index(['clan_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clan_announcements');
    }
};
