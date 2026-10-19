<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE bills MODIFY COLUMN status ENUM('unpaid', 'pending_verification', 'paid', 'voided') NOT NULL DEFAULT 'unpaid'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE bills MODIFY COLUMN status ENUM('unpaid', 'pending_verification', 'paid') NOT NULL DEFAULT 'unpaid'");
        }
    }
};

