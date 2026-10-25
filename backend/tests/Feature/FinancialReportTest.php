<?php

namespace Tests\Feature;

use App\Models\Bill;
use App\Models\Payment;
use App\Models\Property;
use App\Models\Room;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class FinancialReportTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $tenantUser;
    protected Property $property;
    protected Tenant $tenant;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'role' => 'admin',
        ]);

        $this->property = Property::create([
            'name' => 'AriRent Residences Makati',
            'city' => 'Makati',
            'address' => 'Ayala Ave, Makati',
        ]);

        Room::create([
            'property_id' => $this->property->id,
            'room_number' => '101',
            'rent' => 10000.00,
            'status' => 'occupied',
        ]);

        $this->tenantUser = User::factory()->create([
            'role' => 'tenant',
        ]);

        $this->tenant = Tenant::create([
            'user_id' => $this->tenantUser->id,
            'property_id' => $this->property->id,
            'name' => 'Carlos Reyes',
            'username' => 'carlosreyes',
            'password' => \Illuminate\Support\Facades\Hash::make('secret'),
            'email' => 'carlos@test.com',
            'phone' => '09123456789',
            'room' => '101',
            'status' => 'active',
            'balance' => 0.00,
            'move_in_date' => '2026-01-01',
        ]);
    }

    public function test_unauthenticated_user_cannot_access_financial_reports(): void
    {
        $response = $this->getJson('/api/reports/financial');
        $response->assertStatus(401);
    }

    public function test_tenant_cannot_access_financial_reports(): void
    {
        Sanctum::actingAs($this->tenantUser);

        $response = $this->getJson('/api/reports/financial');
        $response->assertStatus(403);
    }

    public function test_admin_can_retrieve_financial_report(): void
    {
        Sanctum::actingAs($this->admin);

        Bill::create([
            'tenant_id' => $this->tenant->id,
            'rent' => 10000.00,
            'electricity' => 500.00,
            'water' => 200.00,
            'total_amount' => 10700.00,
            'paid_amount' => 10700.00,
            'remaining_balance' => 0.00,
            'status' => 'paid',
            'date' => '2026-10-01',
            'due_date' => '2026-10-15',
        ]);

        Bill::create([
            'tenant_id' => $this->tenant->id,
            'rent' => 10000.00,
            'electricity' => 600.00,
            'water' => 200.00,
            'total_amount' => 10800.00,
            'paid_amount' => 5000.00,
            'remaining_balance' => 5800.00,
            'status' => 'partially_paid',
            'date' => '2026-09-01',
            'due_date' => '2026-09-15',
        ]);

        $response = $this->getJson('/api/reports/financial');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'period',
                    'property_id',
                    'kpis' => [
                        'total_billed',
                        'total_collected',
                        'total_outstanding',
                        'collection_rate',
                        'previous_month_collected',
                        'growth_rate',
                    ],
                    'revenue_streams' => [
                        'rent',
                        'electricity',
                        'water',
                        'excess_charges',
                        'late_fees',
                    ],
                    'status_counts' => [
                        'paid',
                        'partially_paid',
                        'unpaid',
                        'overdue',
                        'pending_verification',
                        'total_bills',
                    ],
                    'property_performance',
                    'monthly_trend',
                    'available_months',
                ],
            ]);

        $data = $response->json('data');
        $this->assertEquals(21500.00, $data['kpis']['total_billed']);
        $this->assertEquals(15700.00, $data['kpis']['total_collected']);
        $this->assertEquals(5800.00, $data['kpis']['total_outstanding']);
    }

    public function test_admin_can_filter_report_by_month_and_property(): void
    {
        Sanctum::actingAs($this->admin);

        Bill::create([
            'tenant_id' => $this->tenant->id,
            'rent' => 10000.00,
            'total_amount' => 10000.00,
            'paid_amount' => 10000.00,
            'remaining_balance' => 0.00,
            'status' => 'paid',
            'date' => '2026-10-01',
            'due_date' => '2026-10-15',
        ]);

        Bill::create([
            'tenant_id' => $this->tenant->id,
            'rent' => 8000.00,
            'total_amount' => 8000.00,
            'paid_amount' => 8000.00,
            'remaining_balance' => 0.00,
            'status' => 'paid',
            'date' => '2026-09-01',
            'due_date' => '2026-09-15',
        ]);

        $response = $this->getJson("/api/reports/financial?month=2026-10&property_id={$this->property->id}");

        $response->assertOk();
        $data = $response->json('data');
        $this->assertEquals(10000.00, $data['kpis']['total_billed']);
        $this->assertEquals(10000.00, $data['kpis']['total_collected']);
        $this->assertEquals(0.00, $data['kpis']['total_outstanding']);
    }

    private function makeBill(string $status, string $dueDate, float $total, float $paid): Bill
    {
        return Bill::create([
            'tenant_id' => $this->tenant->id,
            'rent' => $total,
            'total_amount' => $total,
            'paid_amount' => $paid,
            'remaining_balance' => max(0, $total - $paid),
            'status' => $status,
            'date' => now()->startOfMonth()->toDateString(),
            'due_date' => $dueDate,
        ]);
    }

    public function test_overdue_is_derived_from_due_date_not_stored_status(): void
    {
        Sanctum::actingAs($this->admin);

        $past = now()->subDays(3)->toDateString();
        $future = now()->addDays(5)->toDateString();

        // Past due: both count as overdue even though stored status is never "overdue"
        $this->makeBill('unpaid', $past, 10000.00, 0.00);
        $this->makeBill('partially_paid', $past, 8000.00, 3000.00);
        // Not yet due
        $this->makeBill('unpaid', $future, 5000.00, 0.00);
        // Past due date but a payment is awaiting review: not overdue
        $this->makeBill('pending_verification', $past, 4000.00, 0.00);
        $this->makeBill('paid', $past, 2000.00, 2000.00);

        $data = $this->getJson('/api/reports/financial')->assertOk()->json('data');
        $counts = $data['status_counts'];

        $this->assertSame(2, $counts['overdue']);
        $this->assertSame(1, $counts['unpaid']);
        $this->assertSame(0, $counts['partially_paid']);
        $this->assertSame(1, $counts['pending_verification']);
        $this->assertSame(1, $counts['paid']);
        $this->assertSame(5, $counts['total_bills']);

        // Buckets are mutually exclusive: they always add up to the total
        $this->assertSame(
            $counts['total_bills'],
            $counts['paid'] + $counts['partially_paid'] + $counts['unpaid']
                + $counts['overdue'] + $counts['pending_verification']
        );

        $this->assertSame(2, $data['kpis']['overdue_count']);
        $this->assertEquals(15000.00, $data['kpis']['overdue_amount']); // 10000 + (8000 - 3000)
    }

    public function test_voided_bills_are_never_counted_as_overdue(): void
    {
        Sanctum::actingAs($this->admin);

        $this->makeBill('voided', now()->subDays(10)->toDateString(), 9000.00, 0.00);

        $data = $this->getJson('/api/reports/financial')->assertOk()->json('data');

        $this->assertSame(0, $data['status_counts']['overdue']);
        $this->assertSame(0, $data['status_counts']['total_bills']);
        $this->assertEquals(0.00, $data['kpis']['overdue_amount']);
    }

    public function test_reconciliation_flags_paid_amount_without_payment_records(): void
    {
        Sanctum::actingAs($this->admin);

        $bill = $this->makeBill('paid', now()->addDays(5)->toDateString(), 10000.00, 10000.00);

        // Only 4,000 of the 10,000 is backed by a confirmed payment row
        Payment::create([
            'bill_id' => $bill->id,
            'tenant_id' => $this->tenant->id,
            'amount' => 4000.00,
            'payment_method' => 'cash',
            'transaction_reference' => 'CASH-TEST1',
            'status' => 'confirmed',
            'paid_at' => now(),
        ]);

        $rec = $this->getJson('/api/reports/financial')->assertOk()->json('data.reconciliation');

        $this->assertEquals(10000.00, $rec['recorded_paid_amount']);
        $this->assertEquals(4000.00, $rec['confirmed_payments']);
        $this->assertEquals(6000.00, $rec['difference']);
        $this->assertFalse($rec['is_reconciled']);
    }

    public function test_reconciliation_passes_when_payments_match(): void
    {
        Sanctum::actingAs($this->admin);

        $bill = $this->makeBill('paid', now()->addDays(5)->toDateString(), 10000.00, 10000.00);

        Payment::create([
            'bill_id' => $bill->id,
            'tenant_id' => $this->tenant->id,
            'amount' => 10000.00,
            'payment_method' => 'cash',
            'transaction_reference' => 'CASH-TEST2',
            'status' => 'confirmed',
            'paid_at' => now(),
        ]);

        $rec = $this->getJson('/api/reports/financial')->assertOk()->json('data.reconciliation');

        $this->assertEquals(0.00, $rec['difference']);
        $this->assertTrue($rec['is_reconciled']);
    }

    private function daysAgo(int $days): string
    {
        return now()->subDays($days)->toDateString();
    }

    public function test_ar_aging_groups_balances_by_days_past_due(): void
    {
        Sanctum::actingAs($this->admin);

        // Current: not yet due, or due today
        $this->makeBill('unpaid', now()->addDays(5)->toDateString(), 3000.00, 0.00);
        $this->makeBill('unpaid', $this->daysAgo(0), 1000.00, 0.00);
        // 1-30 days (boundaries: 1 and 30). Partial: balance is 8000 - 3000
        $this->makeBill('unpaid', $this->daysAgo(1), 2000.00, 0.00);
        $this->makeBill('partially_paid', $this->daysAgo(30), 8000.00, 3000.00);
        // 31-60 days (boundaries: 31 and 60)
        $this->makeBill('unpaid', $this->daysAgo(31), 1500.00, 0.00);
        $this->makeBill('unpaid', $this->daysAgo(60), 500.00, 0.00);
        // 61-90 days (boundary: 90)
        $this->makeBill('unpaid', $this->daysAgo(90), 700.00, 0.00);
        // Over 90 days (boundary: 91)
        $this->makeBill('unpaid', $this->daysAgo(91), 900.00, 0.00);

        // Never part of aging
        $this->makeBill('paid', $this->daysAgo(40), 5000.00, 5000.00);
        $this->makeBill('voided', $this->daysAgo(40), 6000.00, 0.00);
        $this->makeBill('pending_verification', $this->daysAgo(40), 7000.00, 0.00);

        $aging = $this->getJson('/api/reports/financial')->assertOk()->json('data.ar_aging');
        $buckets = collect($aging['buckets'])->keyBy('key');

        $this->assertSame(now()->toDateString(), $aging['as_of']);
        $this->assertSame(
            ['current', '1_30', '31_60', '61_90', 'over_90'],
            collect($aging['buckets'])->pluck('key')->all()
        );

        $this->assertSame(2, $buckets['current']['bill_count']);
        $this->assertEquals(4000.00, $buckets['current']['amount']);
        $this->assertSame(2, $buckets['1_30']['bill_count']);
        $this->assertEquals(7000.00, $buckets['1_30']['amount']);
        $this->assertSame(2, $buckets['31_60']['bill_count']);
        $this->assertEquals(2000.00, $buckets['31_60']['amount']);
        $this->assertSame(1, $buckets['61_90']['bill_count']);
        $this->assertEquals(700.00, $buckets['61_90']['amount']);
        $this->assertSame(1, $buckets['over_90']['bill_count']);
        $this->assertEquals(900.00, $buckets['over_90']['amount']);

        $this->assertEquals(14600.00, $aging['total_outstanding']);
        $this->assertCount(8, $aging['items']);

        // Most overdue first, and each item carries its tenant details
        $this->assertSame(91, $aging['items'][0]['days_past_due']);
        $this->assertSame('over_90', $aging['items'][0]['bucket']);
        $this->assertSame('Carlos Reyes', $aging['items'][0]['tenant_name']);
        $this->assertSame('101', $aging['items'][0]['room']);
        $this->assertSame('AriRent Residences Makati', $aging['items'][0]['property_name']);
        $this->assertSame(0, end($aging['items'])['days_past_due']);
    }

    public function test_ar_aging_ignores_month_filter_but_respects_property_filter(): void
    {
        Sanctum::actingAs($this->admin);

        $this->makeBill('unpaid', $this->daysAgo(10), 4000.00, 0.00);

        // A second property with its own overdue bill
        $otherProperty = Property::create([
            'name' => 'AriRent Cebu',
            'city' => 'Cebu',
            'address' => 'Colon St, Cebu',
        ]);
        $otherUser = User::factory()->create(['role' => 'tenant']);
        $otherTenant = Tenant::create([
            'user_id' => $otherUser->id,
            'property_id' => $otherProperty->id,
            'name' => 'Maria Santos',
            'username' => 'mariasantos',
            'password' => \Illuminate\Support\Facades\Hash::make('secret'),
            'email' => 'maria@test.com',
            'phone' => '09987654321',
            'room' => '201',
            'status' => 'active',
            'balance' => 0.00,
            'move_in_date' => '2026-01-01',
        ]);
        Bill::create([
            'tenant_id' => $otherTenant->id,
            'rent' => 6000.00,
            'total_amount' => 6000.00,
            'paid_amount' => 0.00,
            'remaining_balance' => 6000.00,
            'status' => 'unpaid',
            'date' => now()->startOfMonth()->toDateString(),
            'due_date' => $this->daysAgo(10),
        ]);

        // A month with no invoices still shows everything owed today
        $all = $this->getJson('/api/reports/financial?month=2020-01')->assertOk()->json('data');
        $this->assertSame(0, $all['status_counts']['total_bills']);
        $this->assertEquals(10000.00, $all['ar_aging']['total_outstanding']);
        $this->assertCount(2, $all['ar_aging']['items']);

        // Property filter narrows aging to one building
        $one = $this->getJson("/api/reports/financial?property_id={$this->property->id}")
            ->assertOk()->json('data.ar_aging');
        $this->assertEquals(4000.00, $one['total_outstanding']);
        $this->assertCount(1, $one['items']);
        $this->assertSame('Carlos Reyes', $one['items'][0]['tenant_name']);
    }

    public function test_ar_aging_is_empty_when_nothing_is_owed(): void
    {
        Sanctum::actingAs($this->admin);

        $this->makeBill('paid', $this->daysAgo(5), 5000.00, 5000.00);

        $aging = $this->getJson('/api/reports/financial')->assertOk()->json('data.ar_aging');

        $this->assertEquals(0.00, $aging['total_outstanding']);
        $this->assertSame([], $aging['items']);
        $this->assertCount(5, $aging['buckets']);
    }
}
