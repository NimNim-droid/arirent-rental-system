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
        Schema::table('utility_readings', function (Blueprint $table) {
            $table->string('meter_photo_url')->nullable()->after('amount');
            $table->enum('type', ['electricity', 'water'])->default('electricity')->after('amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('utility_readings', function (Blueprint $table) {
            $table->dropColumn(['meter_photo_url', 'type']);
        });
    }
};
