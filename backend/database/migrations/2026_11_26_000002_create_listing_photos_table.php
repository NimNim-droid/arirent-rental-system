<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Photos shown on the public listing. A photo always belongs to a property;
 * when room_id is set it is a room photo, otherwise a building photo.
 * The lowest sort_order is the cover image.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('listing_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_id')->constrained('properties')->cascadeOnDelete();
            $table->foreignId('room_id')->nullable()->constrained('rooms')->cascadeOnDelete();
            $table->string('path');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['property_id', 'room_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('listing_photos');
    }
};
