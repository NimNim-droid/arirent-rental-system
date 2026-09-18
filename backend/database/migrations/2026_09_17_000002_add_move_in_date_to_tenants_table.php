<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->date('move_in_date')->nullable()->after('water_rate');
            $table->decimal('advance_paid', 10, 2)->default(0.00)->after('move_in_date');
        });

        // Backfill existing tenants' move_in_date using their created_at date
        DB::statement('UPDATE tenants SET move_in_date = DATE(created_at) WHERE move_in_date IS NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn(['move_in_date', 'advance_paid']);
        });
    }
};
