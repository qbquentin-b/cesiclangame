<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_troops', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('soldier_type_id')->constrained('soldier_types')->cascadeOnDelete();
            $table->integer('quantity')->default(0);
            $table->integer('in_training')->default(0);
            $table->timestamp('training_done_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'soldier_type_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_troops');
    }
};
