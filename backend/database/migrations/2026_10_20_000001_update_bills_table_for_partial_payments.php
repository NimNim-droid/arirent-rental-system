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
        Schema::table('bills', function (Blueprint $table) {
            $table->decimal('paid_amount', 10, 2)->default(0.00)->after('total_amount');
            $table->decimal('remaining_balance', 10, 2)->default(0.00)->after('paid_amount');
            $table->decimal('excess_charges_total', 10, 2)->default(0.00)->after('water');
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE bills MODIFY COLUMN status ENUM('unpaid', 'partially_paid', 'pending_verification', 'paid', 'overdue', 'voided') NOT NULL DEFAULT 'unpaid'");
        }

        // Backfill existing bills remaining_balance and paid_amount
        DB::table('bills')->where('status', 'paid')->update([
            'paid_amount' => DB::raw('total_amount'),
            'remaining_balance' => 0.00,
        ]);

        DB::table('bills')->where('status', '!=', 'paid')->update([
            'paid_amount' => 0.00,
            'remaining_balance' => DB::raw('total_amount'),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE bills MODIFY COLUMN status ENUM('unpaid', 'pending_verification', 'paid', 'voided') NOT NULL DEFAULT 'unpaid'");
        }

        Schema::table('bills', function (Blueprint $table) {
            $table->dropColumn(['paid_amount', 'remaining_balance', 'excess_charges_total']);
        });
    }
};
