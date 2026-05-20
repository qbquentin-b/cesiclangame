<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('casino_jackpot', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('amount')->default(1000);
            $table->timestamps();
        });

        DB::table('casino_jackpot')->insert([
            'amount'     => 1000,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('casino_jackpot');
    }
};
