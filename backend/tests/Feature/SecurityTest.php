<?php

namespace Tests\Feature;

use App\Models\Bill;
use App\Models\Property;
use App\Models\Room;
use App\Models\Tenant;
use App\Models\User;
use App\Models\UtilityReading;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SecurityTest extends TestCase
{
    use RefreshDatabase;

    private User $tenantUserA;
    private Tenant $tenantA;
    private User $tenantUserB;
    private Tenant $tenantB;
    private Property $property;

    protected function setUp(): void
    {
        parent::setUp();

        $this->property = Property::create([
            'name' => 'Makati Suites',
            'city' => 'Makati',
            'address' => 'Ayala Ave',
        ]);

        Room::create([
            'property_id' => $this->property->id,
            'room_number' => '101',
            'rent' => 12000.00,
            'status' => 'occupied',
        ]);

        Room::create([
            'property_id' => $this->property->id,
            'room_number' => '102',
            'rent' => 12000.00,
            'status' => 'occupied',
        ]);

        $this->tenantUserA = User::create([
            'name' => 'Tenant Alice',
            'email' => 'alice@example.com',
            'password' => Hash::make('secret'),
            'role' => 'tenant',
        ]);

        $this->tenantA = Tenant::create([
            'user_id' => $this->tenantUserA->id,
            'property_id' => $this->property->id,
            'room' => '101',
            'username' => 'alice101',
            'name' => 'Tenant Alice',
            'email' => 'alice@example.com',
            'phone' => '09111111111',
            'password' => Hash::make('secret'),
            'status' => 'active',
            'balance' => 0.00,
            'water_rate' => 500.00,
        ]);

        $this->tenantUserB = User::create([
            'name' => 'Tenant Bob',
            'email' => 'bob@example.com',
            'password' => Hash::make('secret'),
            'role' => 'tenant',
        ]);

        $this->tenantB = Tenant::create([
            'user_id' => $this->tenantUserB->id,
            'property_id' => $this->property->id,
            'room' => '102',
            'username' => 'bob102',
            'name' => 'Tenant Bob',
            'email' => 'bob@example.com',
            'phone' => '09222222222',
            'password' => Hash::make('secret'),
            'status' => 'active',
            'balance' => 0.00,
            'water_rate' => 500.00,
        ]);
    }

    public function test_unauthenticated_request_is_rejected_on_protected_routes(): void
    {
        $response = $this->getJson('/api/dashboard/stats');
        $response->assertStatus(401);

        $responseBills = $this->getJson('/api/bills');
        $responseBills->assertStatus(401);
    }

    public function test_tenant_cannot_access_admin_dashboard_stats(): void
    {
        Sanctum::actingAs($this->tenantUserA);

        $response = $this->getJson('/api/dashboard/stats');
        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Unauthorized. Admin access required.',
            ]);
    }

    public function test_tenant_cannot_generate_bills(): void
    {
        Sanctum::actingAs($this->tenantUserA);

        $response = $this->postJson('/api/bills/generate', []);
        $response->assertStatus(403);
    }

    public function test_tenant_cannot_record_utility_readings(): void
    {
        Sanctum::actingAs($this->tenantUserA);

        $response = $this->postJson('/api/readings', [
            'tenant_id' => $this->tenantA->id,
            'prev_reading' => 100,
            'curr_reading' => 150,
            'date' => now()->format('Y-m-d'),
        ]);
        $response->assertStatus(403);
    }

    public function test_tenant_cannot_view_another_tenants_utility_reading_idor_prevention(): void
    {
        $readingBob = UtilityReading::create([
            'tenant_id' => $this->tenantB->id,
            'prev_reading' => 200,
            'curr_reading' => 250,
            'usage_kwh' => 50,
            'amount' => 625.00,
            'date' => now()->format('Y-m-d'),
        ]);

        // Alice attempts to inspect Bob's reading
        Sanctum::actingAs($this->tenantUserA);

        $response = $this->getJson("/api/readings/{$readingBob->id}");
        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Unauthorized to view this reading.',
            ]);
    }

    public function test_tenant_cannot_view_another_tenants_bill_idor_prevention(): void
    {
        $billBob = Bill::create([
            'tenant_id' => $this->tenantB->id,
            'rent' => 12000.00,
            'electricity' => 600.00,
            'water' => 500.00,
            'total_amount' => 13100.00,
            'date' => now()->format('Y-m-d'),
            'due_date' => now()->addDays(5)->format('Y-m-d'),
            'status' => 'unpaid',
        ]);

        // Alice attempts to view Bob's bill
        Sanctum::actingAs($this->tenantUserA);

        $response = $this->getJson("/api/bills/{$billBob->id}");
        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Unauthorized to view this bill.',
            ]);
    }

    public function test_tenant_cannot_modify_other_tenants_or_elevate_balance(): void
    {
        Sanctum::actingAs($this->tenantUserA);

        // Alice tries to zero out Bob's balance
        $response = $this->putJson("/api/tenants/{$this->tenantB->id}", [
            'balance' => 0.00,
            'water_rate' => 100.00,
        ]);

        $response->assertStatus(403);
    }

    public function test_tenant_cannot_list_tenants(): void
    {
        Sanctum::actingAs($this->tenantUserA);

        $response = $this->getJson('/api/tenants');
        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Unauthorized. Admin access required.',
            ]);
    }

    public function test_tenant_cannot_view_another_tenant_profile(): void
    {
        Sanctum::actingAs($this->tenantUserA);

        // Alice attempts to inspect Bob's tenant profile
        $response = $this->getJson("/api/tenants/{$this->tenantB->id}");
        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Unauthorized to view this tenant profile.',
            ]);
    }

    public function test_tenant_can_view_own_profile(): void
    {
        Sanctum::actingAs($this->tenantUserA);

        // Alice views her own tenant profile
        $response = $this->getJson("/api/tenants/{$this->tenantA->id}");
        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => (string) $this->tenantA->id,
                    'name' => 'Tenant Alice',
                    'email' => 'alice@example.com',
                ],
            ]);
    }
}

