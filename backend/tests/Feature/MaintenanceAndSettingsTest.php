<?php

namespace Tests\Feature;

use App\Models\MaintenanceTicket;
use App\Models\Property;
use App\Models\Room;
use App\Models\Setting;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MaintenanceAndSettingsTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $tenantUser;
    private Tenant $tenant;
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
            'rent' => 10000.00,
            'status' => 'occupied',
        ]);

        $this->admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => Hash::make('secret'),
            'role' => 'admin',
        ]);

        $this->tenantUser = User::create([
            'name' => 'Tenant Bob',
            'email' => 'bob@example.com',
            'password' => Hash::make('secret'),
            'role' => 'tenant',
        ]);

        $this->tenant = Tenant::create([
            'user_id' => $this->tenantUser->id,
            'property_id' => $this->property->id,
            'room' => '101',
            'username' => 'bob101',
            'name' => 'Tenant Bob',
            'email' => 'bob@example.com',
            'phone' => '09170000001',
            'password' => Hash::make('secret'),
            'status' => 'active',
            'balance' => 0.00,
            'water_rate' => 350.00,
            'lease_end' => '2027-01-01',
        ]);
    }

    public function test_admin_can_update_settings(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->postJson('/api/settings', [
            'elec_rate' => 14.50,
            'water_rate' => 450.00,
            'gcash_name' => 'AriRent Landlord',
            'gcash_number' => '0917-999-8888',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('settings', [
            'elec_rate' => 14.50,
            'water_rate' => 450.00,
            'gcash_name' => 'AriRent Landlord',
            'gcash_number' => '0917-999-8888',
        ]);
    }

    public function test_tenant_cannot_update_settings(): void
    {
        Sanctum::actingAs($this->tenantUser);

        $response = $this->postJson('/api/settings', [
            'elec_rate' => 5.00,
            'water_rate' => 100.00,
        ]);

        $response->assertStatus(403);
    }

    public function test_tenant_can_submit_ticket_and_admin_can_resolve(): void
    {
        Sanctum::actingAs($this->tenantUser);

        $response = $this->postJson('/api/maintenance', [
            'type' => 'plumbing',
            'description' => 'Leaking bathroom sink faucet',
            'priority' => 'urgent',
        ]);

        $response->assertStatus(201);
        $ticketId = $response->json('data.id');

        $this->assertDatabaseHas('maintenance_tickets', [
            'id' => $ticketId,
            'tenant_id' => $this->tenant->id,
            'status' => 'pending',
            'priority' => 'urgent',
        ]);

        // Admin updates status to resolved
        Sanctum::actingAs($this->admin);

        $updateResponse = $this->putJson("/api/maintenance/{$ticketId}", [
            'status' => 'resolved',
            'technician_name' => 'Mario',
            'admin_notes' => 'Fixed valve replaced',
        ]);

        $updateResponse->assertStatus(200);
        $this->assertDatabaseHas('maintenance_tickets', [
            'id' => $ticketId,
            'status' => 'resolved',
            'technician_name' => 'Mario',
        ]);
        $this->assertNotNull(MaintenanceTicket::find($ticketId)->resolved_date);
    }

    public function test_tenant_cannot_resolve_or_delete_ticket(): void
    {
        $ticket = MaintenanceTicket::create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'room' => '101',
            'type' => 'electrical',
            'description' => 'Light switch broken',
            'priority' => 'normal',
            'status' => 'pending',
        ]);

        Sanctum::actingAs($this->tenantUser);

        $updateRes = $this->putJson("/api/maintenance/{$ticket->id}", [
            'status' => 'resolved',
        ]);
        $updateRes->assertStatus(403);

        $deleteRes = $this->deleteJson("/api/maintenance/{$ticket->id}");
        $deleteRes->assertStatus(403);
    }

    public function test_tenant_dashboard_returns_unit_and_balance_data(): void
    {
        Sanctum::actingAs($this->tenantUser);

        $response = $this->getJson('/api/tenant/dashboard');

        $response->assertStatus(200)
            ->assertJsonPath('data.unit.room', '101')
            ->assertJsonPath('data.unit.property_name', 'Makati Suites')
            ->assertJsonPath('data.outstanding_balance', 0);
    }

    public function test_admin_ticket_index_supports_search_date_range_and_status_counts(): void
    {
        MaintenanceTicket::create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'room' => '101',
            'type' => 'appliances',
            'description' => 'Air conditioner not cooling',
            'priority' => 'normal',
            'status' => 'pending',
        ]);

        MaintenanceTicket::create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'room' => '101',
            'type' => 'plumbing',
            'description' => 'Leaking faucet in kitchen sink',
            'priority' => 'urgent',
            'status' => 'in_progress',
            'technician_name' => 'Mario',
        ]);

        MaintenanceTicket::create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'room' => '101',
            'type' => 'electrical',
            'description' => 'Broken light in bedroom',
            'priority' => 'normal',
            'status' => 'resolved',
            'resolved_date' => now(),
        ]);

        MaintenanceTicket::create([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'room' => '101',
            'type' => 'general',
            'description' => 'Old completed request',
            'priority' => 'normal',
            'status' => 'archived',
        ]);

        Sanctum::actingAs($this->admin);

        // Search matches the issue description
        $this->getJson('/api/maintenance?search=air%20conditioner')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.description', 'Air conditioner not cooling');

        // Search matches the tenant name (all four belong to Tenant Bob)
        $this->getJson('/api/maintenance?search=' . urlencode('Tenant Bob'))
            ->assertStatus(200)
            ->assertJsonCount(4, 'data');

        // Search with no match returns empty data
        $this->getJson('/api/maintenance?search=nonexistent-issue')
            ->assertStatus(200)
            ->assertJsonCount(0, 'data');

        // Date range includes tickets created today
        $today = now()->toDateString();
        $this->getJson("/api/maintenance?date_from={$today}&date_to={$today}")
            ->assertStatus(200)
            ->assertJsonCount(4, 'data');

        // Date range strictly in the future excludes all tickets
        $tomorrow = now()->addDay()->toDateString();
        $this->getJson("/api/maintenance?date_from={$tomorrow}")
            ->assertStatus(200)
            ->assertJsonCount(0, 'data');

        // Invalid date ranges are rejected with 422
        $this->getJson("/api/maintenance?date_from={$tomorrow}&date_to={$today}")
            ->assertStatus(422);

        // Status counts are returned in meta (archived excluded from non-archived total)
        $this->getJson('/api/maintenance')
            ->assertStatus(200)
            ->assertJsonPath('meta.status_counts.pending', 1)
            ->assertJsonPath('meta.status_counts.in_progress', 1)
            ->assertJsonPath('meta.status_counts.resolved', 1)
            ->assertJsonPath('meta.status_counts.archived', 1)
            ->assertJsonPath('meta.total', 4);

        // Status filter narrows results; 'active' hides archived tickets
        $this->getJson('/api/maintenance?status=pending')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.status_counts.resolved', 1);

        $this->getJson('/api/maintenance?status=active')
            ->assertStatus(200)
            ->assertJsonCount(3, 'data');

        $this->getJson('/api/maintenance?status=archived')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    public function test_tenant_cannot_exceed_daily_ticket_limit(): void
    {
        Sanctum::actingAs($this->tenantUser);

        // First 3 tickets today are allowed
        for ($i = 1; $i <= 3; $i++) {
            $this->postJson('/api/maintenance', [
                'type' => 'plumbing',
                "description" => "Daily ticket {$i}",
                'priority' => 'normal',
            ])->assertStatus(201);
        }

        $this->assertCount(3, MaintenanceTicket::where('tenant_id', $this->tenant->id)->get());

        // The 4th ticket on the same day must be rejected and not saved
        $response = $this->postJson('/api/maintenance', [
            'type' => 'electrical',
            'description' => 'Fourth ticket today',
            'priority' => 'urgent',
        ]);

        $response->assertStatus(422);
        $this->assertStringContainsString(
            'Daily maintenance ticket limit reached',
            $response->json('message')
        );
        $this->assertCount(3, MaintenanceTicket::where('tenant_id', $this->tenant->id)->get());
    }

    public function test_daily_ticket_limit_resets_each_day(): void
    {
        // A ticket created yesterday should not count toward today's limit
        MaintenanceTicket::query()->insert([
            'tenant_id' => $this->tenant->id,
            'property_id' => $this->property->id,
            'room' => '101',
            'type' => 'plumbing',
            'description' => 'Yesterday ticket',
            'priority' => 'normal',
            'status' => 'pending',
            'created_at' => now()->subDay(),
            'updated_at' => now()->subDay(),
        ]);

        Sanctum::actingAs($this->tenantUser);

        // The tenant can still submit 3 tickets today
        for ($i = 1; $i <= 3; $i++) {
            $this->postJson('/api/maintenance', [
                'type' => 'plumbing',
                "description" => "Today ticket {$i}",
                'priority' => 'normal',
            ])->assertStatus(201);
        }

        $this->assertCount(4, MaintenanceTicket::where('tenant_id', $this->tenant->id)->get());

        // The 4th ticket today is still blocked
        $response = $this->postJson('/api/maintenance', [
            'type' => 'electrical',
            'description' => 'Fourth ticket today',
            'priority' => 'urgent',
        ]);

        $response->assertStatus(422);
        $this->assertCount(4, MaintenanceTicket::where('tenant_id', $this->tenant->id)->get());
    }
}
