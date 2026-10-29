<?php

namespace Tests\Feature;

use App\Models\Bill;
use App\Models\Property;
use App\Models\Room;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class BalanceReconciliationTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    protected function setUp(): void
    {
        parent::setUp();

        $property = Property::create([
            'name' => 'AriRent Residences',
            'address' => '123 Main St',
            'city' => 'Cebu City',
        ]);

        Room::create([
            'property_id' => $property->id,
            'room_number' => '101',
            'rent' => 8000.00,
            'status' => 'occupied',
        ]);

        $user = User::factory()->create([
            'role' => 'tenant',
            'email' => 'balance@example.com',
        ]);

        $this->tenant = Tenant::create([
            'user_id' => $user->id,
            'property_id' => $property->id,
            'room' => '101',
            'username' => 'balancecheck',
            'password' => \Illuminate\Support\Facades\Hash::make('secret'),
            'name' => 'Balance Check',
            'email' => 'balance@example.com',
            'phone' => '09170000000',
            'status' => 'active',
            'balance' => 11000.00,
            'move_in_date' => '2026-01-01',
        ]);

        Bill::create([
            'tenant_id' => $this->tenant->id,
            'rent' => 8000.00,
            'total_amount' => 8000.00,
            'date' => '2026-01-01',
            'due_date' => '2026-01-05',
            'status' => 'unpaid',
        ]);

        Bill::create([
            'tenant_id' => $this->tenant->id,
            'rent' => 2500.00,
            'total_amount' => 2500.00,
            'date' => '2026-02-01',
            'due_date' => '2026-02-05',
            'status' => 'unpaid',
        ]);

        Bill::create([
            'tenant_id' => $this->tenant->id,
            'rent' => 500.00,
            'total_amount' => 500.00,
            'remaining_balance' => 500.00,
            'date' => '2026-03-01',
            'due_date' => '2026-03-05',
            'status' => 'voided',
        ]);
    }

    public function test_dry_run_reports_drift_without_changing_balances(): void
    {
        $this->artisan('arirent:reconcile-balances')
            ->expectsOutputToContain('drift 500.00')
            ->assertSuccessful();

        $this->assertEquals(11000.00, (float) $this->tenant->fresh()->balance);
    }

    public function test_fix_applies_the_ledger_balance_and_ignores_voided_bills(): void
    {
        Cache::put("tenant_dashboard_{$this->tenant->id}", ['outstanding_balance' => 11000.00], 60);

        $this->artisan('arirent:reconcile-balances', ['--fix' => true])
            ->assertSuccessful();

        // 8000 + 2500 from non-voided bills; the voided 500 is excluded.
        $this->assertEquals(10500.00, (float) $this->tenant->fresh()->balance);
        $this->assertNull(Cache::get("tenant_dashboard_{$this->tenant->id}"));
    }

    public function test_a_clean_ledger_is_reported_and_left_untouched(): void
    {
        $this->tenant->update(['balance' => 10500.00]);

        $this->artisan('arirent:reconcile-balances')
            ->expectsOutputToContain('All tenant balances match the bill ledger.')
            ->assertSuccessful();

        $this->assertEquals(10500.00, (float) $this->tenant->fresh()->balance);
    }

    public function test_single_tenant_option_limits_the_scope(): void
    {
        $otherUser = User::factory()->create([
            'role' => 'tenant',
            'email' => 'other@example.com',
        ]);

        $other = Tenant::create([
            'user_id' => $otherUser->id,
            'property_id' => $this->tenant->property_id,
            'room' => '102',
            'username' => 'othertenant',
            'password' => \Illuminate\Support\Facades\Hash::make('secret'),
            'name' => 'Other Tenant',
            'email' => 'other@example.com',
            'phone' => '09170000002',
            'status' => 'active',
            'balance' => 9000.00,
            'move_in_date' => '2026-01-01',
        ]);

        $this->artisan('arirent:reconcile-balances', [
            '--fix' => true,
            '--tenant' => $this->tenant->id,
        ])->assertSuccessful();

        $this->assertEquals(10500.00, (float) $this->tenant->fresh()->balance);
        // The other tenant was out of scope and keeps its drift.
        $this->assertEquals(9000.00, (float) $other->fresh()->balance);
    }
}
