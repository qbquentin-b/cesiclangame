<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->bigInteger('casino_winnings')->default(0)->after('slot_free_spins');
            $table->unsignedBigInteger('total_spent')->default(0)->after('casino_winnings');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['casino_winnings', 'total_spent']);
        });
    }
};
