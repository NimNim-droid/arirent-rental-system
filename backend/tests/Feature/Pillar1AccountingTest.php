<?php

namespace Tests\Feature;

use App\Models\Bill;
use App\Models\ExcessCharge;
use App\Models\Payment;
use App\Models\Property;
use App\Models\Room;
use App\Models\Setting;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class Pillar1AccountingTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $tenantUser;
    protected Property $property;
    protected Room $room;
    protected Tenant $tenant;

    protected function setUp(): void
    {
        parent::setUp();

        Setting::create([
            'admin_email' => 'admin@arirent.com',
            'electricity_rate' => 12.00,
            'water_rate' => 150.00,
            'due_day_of_month' => 5,
        ]);

        $this->adminUser = User::factory()->create([
            'role' => 'admin',
            'email' => 'admin@arirent.com',
        ]);

        $this->tenantUser = User::factory()->create([
            'role' => 'tenant',
            'email' => 'tenant@arirent.com',
        ]);

        $this->property = Property::create([
            'name' => 'AriRent Residences',
            'address' => '123 Main St',
            'city' => 'Cebu City',
        ]);

        $this->room = Room::create([
            'property_id' => $this->property->id,
            'room_number' => '101',
            'rent' => 8000.00,
            'status' => 'occupied',
        ]);

        $this->tenant = Tenant::create([
            'user_id' => $this->tenantUser->id,
            'property_id' => $this->property->id,
            'room' => '101',
            'username' => 'juandelacruz',
            'password' => \Illuminate\Support\Facades\Hash::make('secret'),
            'name' => 'Juan Dela Cruz',
            'email' => 'tenant@arirent.com',
            'phone' => '09171234567',
            'status' => 'active',
            'balance' => 8000.00,
            'move_in_date' => '2026-01-01',
        ]);
    }

    public function test_partial_payment_workflow_updates_balances_and_status(): void
    {
        // 1. Create bill of ₱8,000
        $bill = Bill::create([
            'tenant_id' => $this->tenant->id,
            'rent' => 8000.00,
            'total_amount' => 8000.00,
            'paid_amount' => 0.00,
            'remaining_balance' => 8000.00,
            'date' => '2026-03-01',
            'due_date' => '2026-03-05',
            'status' => 'unpaid',
        ]);

        // 2. Tenant submits partial payment of ₱3,000
        Sanctum::actingAs($this->tenantUser);
        $payRes1 = $this->postJson("/api/bills/{$bill->id}/pay", [
            'amount' => 3000.00,
            'gcash_ref' => 'GCASH-PARTIAL-1',
            'notes' => 'First installment',
        ]);

        $payRes1->assertStatus(200);
        $this->assertEquals('pending_verification', $bill->fresh()->status);

        // Verify Payment record was created
        $payment1 = Payment::where('bill_id', $bill->id)->first();
        $this->assertNotNull($payment1);
        $this->assertEquals(3000.00, (float) $payment1->amount);
        $this->assertEquals('pending', $payment1->status);

        // 3. Admin approves first partial payment
        Sanctum::actingAs($this->adminUser);
        $verifyRes1 = $this->postJson("/api/bills/{$bill->id}/verify", [
            'approved' => true,
        ]);

        $verifyRes1->assertStatus(200);
        $freshBill = $bill->fresh();
        $this->assertEquals('partially_paid', $freshBill->status);
        $this->assertEquals(3000.00, (float) $freshBill->paid_amount);
        $this->assertEquals(5000.00, (float) $freshBill->remaining_balance);
        $this->assertEquals(5000.00, (float) $this->tenant->fresh()->balance);

        // 4. Tenant pays remaining ₱5,000
        Sanctum::actingAs($this->tenantUser);
        $payRes2 = $this->postJson("/api/bills/{$bill->id}/pay", [
            'amount' => 5000.00,
            'gcash_ref' => 'GCASH-PARTIAL-2',
            'notes' => 'Settlement installment',
        ]);
        $payRes2->assertStatus(200);

        // 5. Admin approves second payment
        Sanctum::actingAs($this->adminUser);
        $verifyRes2 = $this->postJson("/api/bills/{$bill->id}/verify", [
            'approved' => true,
        ]);

        $verifyRes2->assertStatus(200);
        $finalBill = $bill->fresh();
        $this->assertEquals('paid', $finalBill->status);
        $this->assertEquals(8000.00, (float) $finalBill->paid_amount);
        $this->assertEquals(0.00, (float) $finalBill->remaining_balance);
        $this->assertEquals(0.00, (float) $this->tenant->fresh()->balance);
    }

    public function test_excess_charges_are_attached_during_bill_generation(): void
    {
        // 1. Admin logs an excess charge (e.g. Aircon maintenance fee: ₱500)
        Sanctum::actingAs($this->adminUser);
        $chargeRes = $this->postJson('/api/excess-charges', [
            'tenant_id' => $this->tenant->id,
            'title' => 'Extra Aircon Installation Fee',
            'amount' => 500.00,
            'charge_date' => '2026-03-01',
        ]);
        $chargeRes->assertStatus(201);

        $charge = ExcessCharge::first();
        $this->assertEquals('pending', $charge->status);

        // 2. Admin generates monthly bills for March 2026
        $genRes = $this->postJson('/api/bills/generate', [
            'date' => '2026-03-01',
        ]);
        $genRes->assertStatus(200);

        // Rent (8000) + Water (500) + Excess Charge (500) = 9000
        $bill = Bill::where('tenant_id', $this->tenant->id)->first();
        $this->assertNotNull($bill);
        $this->assertEquals(9000.00, (float) $bill->total_amount);
        $this->assertEquals(9000.00, (float) $bill->remaining_balance);

        // Excess charge must now be 'billed' and linked to this bill
        $this->assertEquals('billed', $charge->fresh()->status);
        $this->assertEquals($bill->id, $charge->fresh()->bill_id);
    }

    public function test_direct_payment_records_cash_payment(): void
    {
        $bill = Bill::create([
            'tenant_id' => $this->tenant->id,
            'rent' => 8000.00,
            'total_amount' => 8000.00,
            'date' => '2026-03-01',
            'due_date' => '2026-03-05',
            'status' => 'unpaid',
        ]);

        Sanctum::actingAs($this->adminUser);
        $directRes = $this->postJson("/api/bills/{$bill->id}/direct-payment", [
            'amount' => 4000.00,
            'payment_method' => 'cash',
            'notes' => 'Paid in cash at leasing office',
        ]);

        $directRes->assertStatus(200);
        $freshBill = $bill->fresh();
        $this->assertEquals('partially_paid', $freshBill->status);
        $this->assertEquals(4000.00, (float) $freshBill->paid_amount);
        $this->assertEquals(4000.00, (float) $freshBill->remaining_balance);
        $this->assertEquals(4000.00, (float) $this->tenant->fresh()->balance);

        // Verify payment record
        $payment = Payment::where('bill_id', $bill->id)->first();
        $this->assertEquals('confirmed', $payment->status);
        $this->assertEquals('cash', $payment->payment_method);
    }

    public function test_delinquency_endpoint_returns_tenants_with_consecutive_overdue_bills(): void
    {
        // Create 2 overdue unpaid bills in the past
        Bill::create([
            'tenant_id' => $this->tenant->id,
            'rent' => 8000.00,
            'total_amount' => 8000.00,
            'remaining_balance' => 8000.00,
            'date' => '2026-01-01',
            'due_date' => '2026-01-05',
            'status' => 'unpaid',
        ]);

        Bill::create([
            'tenant_id' => $this->tenant->id,
            'rent' => 8000.00,
            'total_amount' => 8000.00,
            'remaining_balance' => 8000.00,
            'date' => '2026-02-01',
            'due_date' => '2026-02-05',
            'status' => 'unpaid',
        ]);

        Sanctum::actingAs($this->adminUser);
        $res = $this->getJson('/api/bills/delinquencies');

        $res->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'tenant_id',
                        'tenant_name',
                        'room',
                        'overdue_count',
                        'total_overdue',
                        'bills',
                    ],
                ],
                'count',
            ]);

        $this->assertEquals(1, $res->json('count'));
        $this->assertEquals(2, $res->json('data.0.overdue_count'));
        $this->assertEquals(16000.00, (float) $res->json('data.0.total_overdue'));
    }
}
