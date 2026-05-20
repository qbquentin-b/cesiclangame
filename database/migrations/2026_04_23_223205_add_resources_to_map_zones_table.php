<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('map_zones', function (Blueprint $table) {
            $table->string('resource_primary')->default('food')->after('type');
            $table->string('resource_secondary')->nullable()->after('resource_primary');
            $table->integer('reserve_primary')->default(400)->after('resource_secondary');
            $table->integer('reserve_secondary')->nullable()->after('reserve_primary');
            $table->integer('reserve_max')->default(400)->after('reserve_secondary');
            $table->timestamp('last_extracted_at')->nullable()->after('reserve_max');
        });
    }

    public function down(): void
    {
        Schema::table('map_zones', function (Blueprint $table) {
            $table->dropColumn([
                'resource_primary', 'resource_secondary',
                'reserve_primary', 'reserve_secondary',
                'reserve_max', 'last_extracted_at',
            ]);
        });
    }
};
