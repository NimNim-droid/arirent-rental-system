<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Visit requests submitted from the public listing (no account required).
 *
 * Status workflow: new -> scheduled -> visited -> converted
 *                  any open status -> cancelled
 *
 * An inquiry never reserves a room; only an application does.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inquiries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_id')->constrained('properties')->cascadeOnDelete();
            $table->foreignId('room_id')->nullable()->constrained('rooms')->nullOnDelete();
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->nullOnDelete();
            $table->string('name', 100);
            $table->string('phone', 30);
            $table->string('email')->nullable();
            $table->date('preferred_date')->nullable();
            $table->string('preferred_time', 20)->nullable();
            $table->text('message')->nullable();
            $table->string('status', 20)->default('new');
            $table->dateTime('scheduled_at')->nullable();
            $table->text('admin_notes')->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at']);
            $table->index('property_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inquiries');
    }
};
