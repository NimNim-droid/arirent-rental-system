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
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UtilityReadingTest extends TestCase
{
    use RefreshDatabase;

    private User $adminUser;
    private Tenant $tenant;
    private Property $property;

    protected function setUp(): void
    {
        parent::setUp();

        Setting::create([
            'elec_rate' => 12.50,
            'water_rate' => 500.00,
            'gcash_name' => 'AriRent Management',
            'gcash_number' => '0917-123-4567',
        ]);

        $this->adminUser = User::create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
        ]);

        $this->property = Property::create([
            'name' => 'AriRent Residences',
            'city' => 'Makati',
            'address' => 'Ayala Ave',
        ]);

        Room::create([
            'property_id' => $this->property->id,
            'room_number' => '101',
            'rent' => 10000.00,
            'status' => 'occupied',
        ]);

        $user = User::create([
            'name' => 'Maria Santos',
            'email' => 'maria@example.com',
            'password' => Hash::make('secret'),
            'role' => 'tenant',
        ]);

        $this->tenant = Tenant::create([
            'user_id' => $user->id,
            'property_id' => $this->property->id,
            'room' => '101',
            'username' => 'msantos101',
            'name' => 'Maria Santos',
            'email' => 'maria@example.com',
            'phone' => '09171234567',
            'password' => Hash::make('secret'),
            'status' => 'active',
            'balance' => 10000.00,
            'water_rate' => 500.00,
            'move_in_date' => Carbon::parse('2026-01-01'),
        ]);
    }

    public function test_record_reading_calculates_kwh_and_auto_updates_unpaid_bill(): void
    {
        Sanctum::actingAs($this->adminUser);

        $today = now()->format('Y-m-d');

        // Create unpaid monthly bill without electricity yet
        $bill = Bill::create([
            'tenant_id' => $this->tenant->id,
            'rent' => 10000.00,
            'electricity' => 0.00,
            'elec_usage' => 0.00,
            'water' => 500.00,
            'late_fee' => 0.00,
            'total_amount' => 10500.00,
            'date' => $today,
            'due_date' => now()->addDays(5)->format('Y-m-d'),
            'status' => 'unpaid',
        ]);

        $this->tenant->update(['balance' => 10500.00]);

        // Submit reading: prev = 100, curr = 160 => usage = 60 kWh => amount = 60 * 12.50 = 750.00
        $response = $this->postJson('/api/readings', [
            'tenant_id' => $this->tenant->id,
            'prev_reading' => 100.00,
            'curr_reading' => 160.00,
            'date' => $today,
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'bill_updated' => true,
                'data' => [
                    'usage_kwh' => 60,
                    'amount' => 750,
                ],
            ]);

        $freshBill = $bill->fresh();
        $this->assertEquals(750.00, (float) $freshBill->electricity);
        $this->assertEquals(60.00, (float) $freshBill->elec_usage);
        $this->assertEquals(11250.00, (float) $freshBill->total_amount);
        $this->assertEquals(11250.00, (float) $freshBill->remaining_balance);

        // Tenant balance should have increased by the ₱750 electricity diff
        $this->assertEquals(11250.00, (float) $this->tenant->fresh()->balance);
    }

    public function test_delete_reading_reverses_bill_and_tenant_balance_adjustment(): void
    {
        Sanctum::actingAs($this->adminUser);

        $today = now()->format('Y-m-d');

        $reading = UtilityReading::create([
            'tenant_id' => $this->tenant->id,
            'prev_reading' => 100.00,
            'curr_reading' => 160.00,
            'usage_kwh' => 60.00,
            'amount' => 750.00,
            'date' => $today,
        ]);

        $bill = Bill::create([
            'tenant_id' => $this->tenant->id,
            'rent' => 10000.00,
            'electricity' => 750.00,
            'elec_usage' => 60.00,
            'water' => 500.00,
            'total_amount' => 11250.00,
            'date' => $today,
            'due_date' => now()->addDays(5)->format('Y-m-d'),
            'status' => 'unpaid',
        ]);

        $this->tenant->update(['balance' => 11250.00]);

        $deleteResponse = $this->deleteJson("/api/readings/{$reading->id}");
        $deleteResponse->assertStatus(200)
            ->assertJson([
                'message' => 'Utility reading deleted successfully.',
            ]);

        $this->assertDatabaseMissing('utility_readings', ['id' => $reading->id]);

        // Bill electricity reversed
        $freshBill = $bill->fresh();
        $this->assertEquals(0.00, (float) $freshBill->electricity);
        $this->assertEquals(0.00, (float) $freshBill->elec_usage);
        $this->assertEquals(10500.00, (float) $freshBill->total_amount);
        $this->assertEquals(10500.00, (float) $freshBill->remaining_balance);

        // Tenant balance reversed by ₱750
        $this->assertEquals(10500.00, (float) $this->tenant->fresh()->balance);
    }
}
