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
        Schema::table('user_troops', function (Blueprint $table) {
            $table->unsignedInteger('wounded')->default(0)->after('quantity');
            $table->timestamp('healed_at')->nullable()->after('wounded');
        });
    }

    public function down(): void
    {
        Schema::table('user_troops', function (Blueprint $table) {
            $table->dropColumn(['wounded', 'healed_at']);
        });
    }
};
