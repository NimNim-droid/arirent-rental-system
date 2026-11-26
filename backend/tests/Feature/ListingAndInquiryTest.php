<?php

namespace Tests\Feature;

use App\Models\Inquiry;
use App\Models\Property;
use App\Models\Room;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ListingAndInquiryTest extends TestCase
{
    use RefreshDatabase;

    protected function createAdmin(): User
    {
        return User::create([
            'name' => 'Landlord Admin',
            'email' => 'admin@arirent.com',
            'password' => Hash::make('AdminPass1234'),
            'role' => 'admin',
        ]);
    }

    public function test_public_listings_return_published_properties_without_leaking_tenant_data(): void
    {
        $property = Property::create([
            'name' => 'Katipunan Residences',
            'city' => 'Quezon City',
            'address' => '88 Katipunan Ave.',
            'description' => 'Quiet student-friendly apartment building near LRT-2.',
            'contact_name' => 'Maria Santos',
            'contact_phone' => '0917-555-0199',
            'messenger_url' => 'https://m.me/katipunanresidences',
            'house_rules' => 'Visitors until 10 PM. No smoking indoors.',
            'amenities' => ['CCTV Security', 'Fiber WiFi', 'Sub-metered Electricity'],
        ]);

        $vacantRoom = Room::create([
            'property_id' => $property->id,
            'room_number' => '201',
            'rent' => 6500.00,
            'status' => 'vacant',
            'description' => 'Corner studio with natural light and own CR.',
            'capacity' => 2,
            'floor_area' => 18.5,
            'amenities' => ['Private CR', 'Aircon Provision', 'Study Desk'],
            'advance_months' => 1,
            'deposit_months' => 1,
            'is_listed' => true,
        ]);

        $occupiedRoom = Room::create([
            'property_id' => $property->id,
            'room_number' => '202',
            'rent' => 6500.00,
            'status' => 'occupied',
            'capacity' => 1,
            'is_listed' => true,
        ]);

        Room::create([
            'property_id' => $property->id,
            'room_number' => 'STORAGE-1',
            'rent' => 3000.00,
            'status' => 'vacant',
            'is_listed' => false,
        ]);

        $user = User::create([
            'name' => 'Private Occupant',
            'email' => 'occupant@example.com',
            'password' => Hash::make('SecretPass1234'),
            'role' => 'tenant',
        ]);

        Tenant::create([
            'user_id' => $user->id,
            'property_id' => $property->id,
            'room' => $occupiedRoom->room_number,
            'username' => 'privateocc',
            'name' => 'Private Occupant',
            'email' => 'occupant@example.com',
            'phone' => '09170000000',
            'password' => Hash::make('SecretPass1234'),
            'status' => 'active',
            'balance' => 14500.00,
            'water_rate' => 500.00,
        ]);

        $indexResp = $this->getJson('/api/public/listings');
        $indexResp->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Katipunan Residences')
            ->assertJsonPath('data.0.available_rooms_count', 1)
            ->assertJsonPath('data.0.listed_rooms_count', 2)
            ->assertJsonPath('data.0.starting_rent', 6500);

        $rawJson = $indexResp->getContent();
        $this->assertStringNotContainsString('Private Occupant', $rawJson);
        $this->assertStringNotContainsString('occupant@example.com', $rawJson);
        $this->assertStringNotContainsString('STORAGE-1', $rawJson);

        $roomResp = $this->getJson("/api/public/rooms/{$vacantRoom->id}");
        $roomResp->assertOk()
            ->assertJsonPath('data.room_number', '201')
            ->assertJsonPath('data.is_available', true)
            ->assertJsonPath('data.move_in_total', 13000)
            ->assertJsonPath('data.property.contact_phone', '0917-555-0199');
    }

    public function test_admin_can_upload_set_cover_and_delete_listing_photos(): void
    {
        Storage::fake('public');
        $admin = $this->createAdmin();

        $property = Property::create([
            'name' => 'Sampaloc Suites',
            'city' => 'Manila',
            'address' => '410 Espana Blvd.',
        ]);

        $room = Room::create([
            'property_id' => $property->id,
            'room_number' => '101',
            'rent' => 5500,
            'status' => 'vacant',
            'is_listed' => true,
        ]);

        $tinyPng = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=');

        $uploadResp = $this->actingAs($admin)->post("/api/properties/{$property->id}/photos", [
            'room_id' => $room->id,
            'photos' => [
                UploadedFile::fake()->createWithContent('front.png', $tinyPng),
                UploadedFile::fake()->createWithContent('bath.png', $tinyPng),
            ],
        ], ['Accept' => 'application/json']);

        $uploadResp->assertCreated()->assertJsonCount(2, 'data');
        $firstPhotoId = (int) $uploadResp->json('data.0.id');
        $secondPhotoId = (int) $uploadResp->json('data.1.id');

        $this->actingAs($admin)
            ->postJson("/api/listing-photos/{$secondPhotoId}/cover")
            ->assertOk()
            ->assertJsonPath('data.is_cover', true);

        $this->actingAs($admin)
            ->deleteJson("/api/listing-photos/{$firstPhotoId}")
            ->assertOk();

        $this->getJson("/api/public/rooms/{$room->id}")
            ->assertOk()
            ->assertJsonCount(1, 'data.photos');
    }

    public function test_guest_inquiry_does_not_reserve_room_and_application_converts_inquiry(): void
    {
        $admin = $this->createAdmin();

        $property = Property::create([
            'name' => 'Makati Flats',
            'city' => 'Makati',
            'address' => '12 Chino Roces Ave.',
        ]);

        $room = Room::create([
            'property_id' => $property->id,
            'room_number' => '305',
            'rent' => 8500,
            'status' => 'vacant',
            'is_listed' => true,
        ]);

        $inquiryResp = $this->postJson('/api/public/inquiries', [
            'property_id' => $property->id,
            'room_id' => $room->id,
            'name' => 'Carlo Reyes',
            'phone' => '0917-888-2211',
            'email' => 'carlo@example.com',
            'preferred_date' => now()->addDays(2)->format('Y-m-d'),
            'preferred_time' => 'afternoon',
            'message' => 'Can I inspect the unit this week?',
        ]);

        $inquiryResp->assertCreated()
            ->assertJsonPath('data.status', 'new');

        $inquiryId = (int) $inquiryResp->json('data.id');

        // Room MUST remain vacant after inquiry
        $this->assertSame('vacant', $room->fresh()->status);

        // Admin schedules and marks visited
        $this->actingAs($admin)
            ->putJson("/api/inquiries/{$inquiryId}", [
                'status' => 'visited',
                'admin_notes' => 'Visited with parents, liked the corner window.',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'visited');

        // Prospect now applies directly for room_id
        $registerResp = $this->postJson('/api/register', [
            'name' => 'Carlo Reyes',
            'email' => 'carlo@example.com',
            'phone' => '0917-888-2211',
            'room_id' => $room->id,
            'password' => 'StrongPass2026',
            'password_confirmation' => 'StrongPass2026',
        ]);

        $registerResp->assertCreated()
            ->assertJsonPath('tenant.room', '305')
            ->assertJsonPath('tenant.status', 'pending_approval');

        $this->assertSame('reserved', $room->fresh()->status);

        $converted = Inquiry::findOrFail($inquiryId);
        $this->assertSame('converted', $converted->status);
        $this->assertNotNull($converted->tenant_id);
    }

    public function test_unlisted_room_cannot_be_applied_for_online(): void
    {
        $property = Property::create([
            'name' => 'BGC Lofts',
            'city' => 'Taguig',
            'address' => '5th Ave.',
        ]);

        $unlistedRoom = Room::create([
            'property_id' => $property->id,
            'room_number' => '401',
            'rent' => 12000,
            'status' => 'vacant',
            'is_listed' => false,
        ]);

        $this->postJson('/api/register', [
            'name' => 'Jane Applicant',
            'email' => 'jane@example.com',
            'phone' => '0917-123-9999',
            'room_id' => $unlistedRoom->id,
            'password' => 'StrongPass2026',
            'password_confirmation' => 'StrongPass2026',
        ])->assertStatus(422);

        $this->assertSame('vacant', $unlistedRoom->fresh()->status);
    }

    public function test_public_listings_hide_buildings_with_no_vacant_rooms_until_one_becomes_vacant(): void
    {
        $fullBuilding = Property::create([
            'name' => 'Ortigas Heights',
            'city' => 'Pasig',
            'address' => '15 Emerald Ave.',
        ]);

        $occupiedRoom = Room::create([
            'property_id' => $fullBuilding->id,
            'room_number' => '501',
            'rent' => 9500,
            'status' => 'occupied',
            'is_listed' => true,
        ]);

        Room::create([
            'property_id' => $fullBuilding->id,
            'room_number' => '502',
            'rent' => 9500,
            'status' => 'reserved',
            'is_listed' => true,
        ]);

        // Building with 0 vacant rooms must not appear in public catalog
        $this->getJson('/api/public/listings')
            ->assertOk()
            ->assertJsonCount(0, 'data');

        // Once a room becomes vacant again, the building reappears automatically
        $occupiedRoom->update(['status' => 'vacant']);

        $this->getJson('/api/public/listings')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Ortigas Heights')
            ->assertJsonPath('data.0.available_rooms_count', 1);
    }
}
