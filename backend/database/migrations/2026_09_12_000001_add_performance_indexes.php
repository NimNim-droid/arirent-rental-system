<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bills', function (Blueprint $table) {
            $table->index('status');
            $table->index('due_date');
            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'date']);
        });

        Schema::table('tenants', function (Blueprint $table) {
            $table->index('status');
            $table->index(['property_id', 'status']);
        });

        Schema::table('rooms', function (Blueprint $table) {
            $table->index(['property_id', 'room_number']);
        });

        Schema::table('utility_readings', function (Blueprint $table) {
            $table->index(['tenant_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::table('bills', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['due_date']);
            $table->dropIndex(['tenant_id', 'status']);
            $table->dropIndex(['tenant_id', 'date']);
        });

        Schema::table('tenants', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['property_id', 'status']);
        });

        Schema::table('rooms', function (Blueprint $table) {
            $table->dropIndex(['property_id', 'room_number']);
        });

        Schema::table('utility_readings', function (Blueprint $table) {
            $table->dropIndex(['tenant_id', 'date']);
        });
    }
};
