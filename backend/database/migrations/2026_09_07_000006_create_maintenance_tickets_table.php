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
        Schema::create('maintenance_tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('property_id')->constrained('properties')->cascadeOnDelete();
            $table->string('room');
            $table->enum('type', ['plumbing', 'electrical', 'appliances', 'general'])->default('general');
            $table->text('description');
            $table->string('photo_url')->nullable();
            $table->enum('priority', ['normal', 'urgent'])->default('normal');
            $table->enum('status', ['pending', 'in_progress', 'resolved'])->default('pending');
            $table->string('technician_name')->nullable();
            $table->text('admin_notes')->nullable();
            $table->timestamp('resolved_date')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('maintenance_tickets');
    }
};
