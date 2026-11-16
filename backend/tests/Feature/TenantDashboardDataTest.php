<?php

namespace Tests\Feature;

use App\Models\Bill;
use App\Models\Property;
use App\Models\Room;
use App\Models\Setting;
use App\Models\Tenant;
use App\Models\User;
use App\Models\UtilityReading;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TenantDashboardDataTest extends TestCase
{
    use RefreshDatabase;

    private User $tenantUser;

    private Property $property;

    private Tenant $tenant;

    protected function setUp(): void
    {
        parent::setUp();

        Setting::create([
            'elec_rate' => 12.50,
            'water_rate' => 500.00,
            'gcash_name' => 'AriRent Property Management',
            'gcash_number' => '0917-123-4567',
        ]);

        $this->tenantUser = User::create([
            'name' => 'Tenant User',
            'email' => 'tenant@example.com',
            'password' => Hash::make('secret'),
            'role' => 'tenant',
        ]);

        $this->property = Property::create([
            'name' => 'Dashboard Residences',
            'address' => '1 Main St',
            'city' => 'Makati',
        ]);

        Room::create([
            'property_id' => $this->property->id,
            'room_number' => '201',
            'rent' => 9000.00,
            'status' => 'occupied',
        ]);

        $this->tenant = Tenant::create([
            'user_id' => $this->tenantUser->id,
            'property_id' => $this->property->id,
            'room' => '201',
            'username' => 'dashboardtenant',
            'password' => Hash::make('secret'),
            'name' => 'Dashboard Tenant',
            'email' => 'tenant@example.com',
            'phone' => '09170000000',
            'status' => 'active',
            'balance' => 0.00,
            'move_in_date' => '2026-01-01',
        ]);
    }

    public function test_due_date_is_shown_for_a_partially_paid_invoice(): void
    {
        Bill::create([
            'tenant_id' => $this->tenant->id,
            'rent' => 5000.00,
            'total_amount' => 5000.00,
            'paid_amount' => 1000.00,
            'date' => '2026-05-01',
            'due_date' => '2026-05-10',
            'status' => 'partially_paid',
        ]);

        Sanctum::actingAs($this->tenantUser);

        $this->getJson('/api/tenant/dashboard')
            ->assertOk()
            ->assertJsonPath('data.due_date', '2026-05-10');
    }

    public function test_due_date_is_shown_for_an_invoice_awaiting_verification(): void
    {
        Bill::create([
            'tenant_id' => $this->tenant->id,
            'rent' => 5000.00,
            'total_amount' => 5000.00,
            'date' => '2026-06-01',
            'due_date' => '2026-06-10',
            'status' => 'pending_verification',
        ]);

        Sanctum::actingAs($this->tenantUser);

        $this->getJson('/api/tenant/dashboard')
            ->assertOk()
            ->assertJsonPath('data.due_date', '2026-06-10');
    }

    public function test_dashboard_exposes_latest_meter_reading_with_signed_photo_url(): void
    {
        UtilityReading::create([
            'tenant_id' => $this->tenant->id,
            'prev_reading' => 100,
            'curr_reading' => 160,
            'usage_kwh' => 60,
            'amount' => 750.00,
            'meter_photo_url' => 'meter_proofs/proof.jpg',
            'date' => '2026-08-05',
        ]);

        Sanctum::actingAs($this->tenantUser);

        $response = $this->getJson('/api/tenant/dashboard')->assertOk();

        $response->assertJsonPath('data.electricity.prev_reading', 100)
            ->assertJsonPath('data.electricity.latest_reading', 160)
            ->assertJsonPath('data.electricity.usage_kwh', 60)
            ->assertJsonPath('data.electricity.last_reading_date', '2026-08-05');

        $this->assertStringContainsString(
            '/api/files/meter_proofs/proof.jpg',
            (string) $response->json('data.electricity.meter_photo_url')
        );
    }

    public function test_tenant_cannot_upload_replace_or_delete_meter_readings(): void
    {
        $reading = UtilityReading::create([
            'tenant_id' => $this->tenant->id,
            'prev_reading' => 100,
            'curr_reading' => 160,
            'usage_kwh' => 60,
            'amount' => 750.00,
            'meter_photo_url' => 'meter_proofs/proof.jpg',
            'date' => '2026-08-05',
        ]);

        Sanctum::actingAs($this->tenantUser);

        $this->postJson('/api/readings', [
            'tenant_id' => $this->tenant->id,
            'prev_reading' => 160,
            'curr_reading' => 200,
            'date' => '2026-09-05',
            'meter_photo' => UploadedFile::fake()->create('fake.jpg', 10, 'image/jpeg'),
        ])->assertForbidden();

        $this->deleteJson("/api/readings/{$reading->id}")->assertForbidden();

        $this->assertDatabaseHas('utility_readings', [
            'id' => $reading->id,
            'meter_photo_url' => 'meter_proofs/proof.jpg',
        ]);
    }

    public function test_rent_falls_back_to_the_billed_amount_when_the_room_record_is_missing(): void
    {
        $this->tenant->update(['room' => '999']);

        Bill::create([
            'tenant_id' => $this->tenant->id,
            'rent' => 7200.00,
            'total_amount' => 7200.00,
            'date' => '2026-07-01',
            'due_date' => '2026-07-10',
            'status' => 'unpaid',
        ]);

        Sanctum::actingAs($this->tenantUser);

        $this->getJson('/api/tenant/dashboard')
            ->assertOk()
            ->assertJsonPath('data.unit.rent', 7200);
    }
}
