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
        Schema::create('tenants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('property_id')->constrained('properties')->cascadeOnDelete();
            $table->string('room');
            $table->string('username')->unique();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('phone');
            $table->string('password')->nullable();
            $table->enum('status', ['pending_approval', 'active', 'inactive'])->default('pending_approval');
            $table->decimal('balance', 10, 2)->default(0.00);
            $table->decimal('water_rate', 10, 2)->default(500.00);
            $table->date('lease_end')->nullable();
            $table->timestamp('vacated_date')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};
