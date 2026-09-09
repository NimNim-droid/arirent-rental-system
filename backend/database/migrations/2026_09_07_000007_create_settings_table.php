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
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->decimal('elec_rate', 10, 2)->default(12.50);
            $table->decimal('water_rate', 10, 2)->default(500.00);
            $table->string('gcash_name')->default('AriRent Property Management');
            $table->string('gcash_number')->default('0917-123-4567');
            $table->string('gcash_qr_path')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
