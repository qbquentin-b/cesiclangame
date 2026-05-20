<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('war_deployments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('war_id')->constrained('wars')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('clan_id')->constrained('clans')->cascadeOnDelete();
            $table->foreignUuid('commander_id')->nullable()->constrained('commanders')->nullOnDelete();
            $table->json('troops'); // {"eclaireur": 10, "fantassin": 20, ...}
            $table->integer('contribution_score')->default(0);
            $table->timestamps();

            $table->unique(['war_id', 'user_id']);
            $table->index(['war_id', 'clan_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('war_deployments');
    }
};
