<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A bill can only carry one meter reading. Without this, recording a
     * second reading in the same month silently created a duplicate row
     * while the bill only reflected the latest amount.
     */
    public function up(): void
    {
        $duplicates = DB::table('utility_readings')
            ->whereNotNull('bill_id')
            ->select('bill_id')
            ->selectRaw('COUNT(*) as aggregate')
            ->groupBy('bill_id')
            ->havingRaw('COUNT(*) > 1')
            ->get();

        if ($duplicates->isNotEmpty()) {
            throw new RuntimeException(
                'Cannot add the reading uniqueness constraint: multiple readings are attached to the same bill. Resolve these first: '
                . $duplicates->toJson()
            );
        }

        Schema::table('utility_readings', function (Blueprint $table) {
            $table->unique('bill_id', 'utility_readings_bill_id_unique');
        });
    }

    public function down(): void
    {
        Schema::table('utility_readings', function (Blueprint $table) {
            $table->dropUnique('utility_readings_bill_id_unique');
        });
    }
};
