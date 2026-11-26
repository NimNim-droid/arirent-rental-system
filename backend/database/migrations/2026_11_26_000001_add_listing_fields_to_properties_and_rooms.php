<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Public listing details: what a prospective tenant needs to see before
 * contacting the landlord (description, contact channels, amenities,
 * capacity, and move-in requirements).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            $table->text('description')->nullable()->after('address');
            $table->string('contact_name', 100)->nullable()->after('description');
            $table->string('contact_phone', 30)->nullable()->after('contact_name');
            $table->string('contact_email')->nullable()->after('contact_phone');
            $table->string('messenger_url')->nullable()->after('contact_email');
            $table->text('house_rules')->nullable()->after('messenger_url');
            $table->json('amenities')->nullable()->after('house_rules');
        });

        Schema::table('rooms', function (Blueprint $table) {
            $table->text('description')->nullable()->after('status');
            $table->unsignedTinyInteger('capacity')->default(1)->after('description');
            $table->decimal('floor_area', 8, 2)->nullable()->after('capacity');
            $table->json('amenities')->nullable()->after('floor_area');
            $table->unsignedTinyInteger('advance_months')->default(1)->after('amenities');
            $table->unsignedTinyInteger('deposit_months')->default(1)->after('advance_months');
            $table->boolean('is_listed')->default(true)->after('deposit_months');

            $table->index(['is_listed', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->dropIndex(['is_listed', 'status']);
            $table->dropColumn([
                'description',
                'capacity',
                'floor_area',
                'amenities',
                'advance_months',
                'deposit_months',
                'is_listed',
            ]);
        });

        Schema::table('properties', function (Blueprint $table) {
            $table->dropColumn([
                'description',
                'contact_name',
                'contact_phone',
                'contact_email',
                'messenger_url',
                'house_rules',
                'amenities',
            ]);
        });
    }
};
