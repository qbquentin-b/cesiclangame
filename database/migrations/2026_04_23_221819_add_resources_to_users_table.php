<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->integer('wood')->default(0)->after('crystals');
            $table->integer('metal')->default(0)->after('wood');
            $table->integer('energy')->default(0)->after('metal');
            $table->integer('fragments')->default(0)->after('energy');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['wood', 'metal', 'energy', 'fragments']);
        });
    }
};
