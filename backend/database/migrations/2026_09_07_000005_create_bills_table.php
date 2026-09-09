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
        Schema::create('bills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->decimal('rent', 10, 2)->default(0.00);
            $table->decimal('electricity', 10, 2)->default(0.00);
            $table->decimal('elec_usage', 10, 2)->default(0.00);
            $table->decimal('water', 10, 2)->default(0.00);
            $table->decimal('late_fee', 10, 2)->default(0.00);
            $table->decimal('total_amount', 10, 2)->default(0.00);
            $table->date('date');
            $table->date('due_date');
            $table->enum('status', ['unpaid', 'pending_verification', 'paid'])->default('unpaid');
            $table->string('gcash_ref')->nullable();
            $table->string('receipt_url')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('payment_date')->nullable();
            $table->timestamp('approved_date')->nullable();
            $table->string('reject_reason')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bills');
    }
};
