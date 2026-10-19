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
            DB::statement("ALTER TABLE maintenance_tickets MODIFY COLUMN status ENUM('pending', 'in_progress', 'resolved', 'archived') NOT NULL DEFAULT 'pending'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE maintenance_tickets MODIFY COLUMN status ENUM('pending', 'in_progress', 'resolved') NOT NULL DEFAULT 'pending'");
        }
    }
};

