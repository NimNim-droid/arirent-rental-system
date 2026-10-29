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

    public function test_approving_without_a_pending_payment_is_rejected(): void
    {
        $bill = Bill::create([
            'tenant_id' => $this->tenant->id,
            'rent' => 8000.00,
            'total_amount' => 8000.00,
            'date' => '2026-03-01',
            'due_date' => '2026-03-05',
            'status' => 'pending_verification',
        ]);

        Sanctum::actingAs($this->adminUser);
        $this->postJson("/api/bills/{$bill->id}/verify", ['approved' => true])
            ->assertStatus(422)
            ->assertJson(['message' => 'No pending payment was found for this invoice.']);

        $this->assertEquals(0.00, (float) $bill->fresh()->paid_amount);
        $this->assertEquals('pending_verification', $bill->fresh()->status);
    }

    public function test_a_payment_reference_cannot_be_reused(): void
    {
        $firstBill = Bill::create([
            'tenant_id' => $this->tenant->id,
            'rent' => 8000.00,
            'total_amount' => 8000.00,
            'date' => '2026-03-01',
            'due_date' => '2026-03-05',
            'status' => 'unpaid',
        ]);

        $secondBill = Bill::create([
            'tenant_id' => $this->tenant->id,
            'rent' => 8000.00,
            'total_amount' => 8000.00,
            'date' => '2026-04-01',
            'due_date' => '2026-04-05',
            'status' => 'unpaid',
        ]);

        Sanctum::actingAs($this->tenantUser);
        $this->postJson("/api/bills/{$firstBill->id}/pay", [
            'gcash_ref' => 'GCASH-DUPLICATE',
        ])->assertStatus(200);

        $this->postJson("/api/bills/{$secondBill->id}/pay", [
            'gcash_ref' => 'GCASH-DUPLICATE',
        ])->assertStatus(422)
            ->assertJson(['message' => 'That payment reference has already been used.']);

        $this->assertEquals('unpaid', $secondBill->fresh()->status);
    }

    public function test_direct_payment_is_blocked_while_a_payment_is_under_review(): void
    {
        $bill = Bill::create([
            'tenant_id' => $this->tenant->id,
            'rent' => 8000.00,
            'total_amount' => 8000.00,
            'date' => '2026-03-01',
            'due_date' => '2026-03-05',
            'status' => 'pending_verification',
        ]);

        Sanctum::actingAs($this->adminUser);
        $this->postJson("/api/bills/{$bill->id}/direct-payment", [
            'amount' => 4000.00,
            'payment_method' => 'cash',
        ])->assertStatus(422)
            ->assertJson(['message' => 'A payment is already awaiting verification for this invoice.']);

        $this->assertEquals(0.00, (float) $bill->fresh()->paid_amount);
    }

    public function test_financial_edit_preserves_balance_invariant_on_partially_paid_bill(): void
    {
        $bill = Bill::create([
            'tenant_id' => $this->tenant->id,
            'rent' => 8000.00,
            'total_amount' => 8000.00,
            'paid_amount' => 3000.00,
            'date' => '2026-03-01',
            'due_date' => '2026-03-05',
            'status' => 'partially_paid',
        ]);

        $this->tenant->update(['balance' => 5000.00]);

        Sanctum::actingAs($this->adminUser);
        $this->putJson("/api/bills/{$bill->id}", ['rent' => 9000.00])
            ->assertStatus(200)
            ->assertJson([
                'data' => [
                    'total_amount' => 9000.00,
                    'paid_amount' => 3000.00,
                    'remaining_balance' => 6000.00,
                ],
            ]);

        $freshBill = $bill->fresh();
        $this->assertEquals(9000.00, (float) $freshBill->total_amount);
        $this->assertEquals(6000.00, (float) $freshBill->remaining_balance);
        $this->assertEquals(6000.00, (float) $this->tenant->fresh()->balance);
    }

    public function test_financial_edit_is_rejected_on_a_paid_bill(): void
    {
        $bill = Bill::create([
            'tenant_id' => $this->tenant->id,
            'rent' => 8000.00,
            'total_amount' => 8000.00,
            'paid_amount' => 8000.00,
            'date' => '2026-03-01',
            'due_date' => '2026-03-05',
            'status' => 'paid',
        ]);

        Sanctum::actingAs($this->adminUser);
        $this->putJson("/api/bills/{$bill->id}", ['rent' => 9000.00])
            ->assertStatus(422)
            ->assertJson([
                'message' => 'Cannot modify financial amounts on an invoice that is paid.',
            ]);

        $this->assertEquals(8000.00, (float) $bill->fresh()->rent);
    }

    public function test_admin_cannot_overwrite_a_tenant_balance_directly(): void
    {
        Bill::create([
            'tenant_id' => $this->tenant->id,
            'rent' => 8000.00,
            'total_amount' => 8000.00,
            'date' => '2026-03-01',
            'due_date' => '2026-03-05',
            'status' => 'unpaid',
        ]);

        $this->tenant->update(['balance' => 8000.00]);

        Sanctum::actingAs($this->adminUser);
        $this->putJson("/api/tenants/{$this->tenant->id}", ['balance' => 0.00])
            ->assertStatus(422)
            ->assertJsonValidationErrors('balance');

        $this->assertEquals(8000.00, (float) $this->tenant->fresh()->balance);
    }

    public function test_tenant_with_billing_history_cannot_be_deleted(): void
    {
        Bill::create([
            'tenant_id' => $this->tenant->id,
            'rent' => 8000.00,
            'total_amount' => 8000.00,
            'date' => '2026-03-01',
            'due_date' => '2026-03-05',
            'status' => 'unpaid',
        ]);

        Sanctum::actingAs($this->adminUser);
        $this->deleteJson("/api/tenants/{$this->tenant->id}")
            ->assertStatus(422)
            ->assertJson([
                'message' => 'This tenant has billing or service history and cannot be deleted. Vacate the tenant instead.',
            ]);

        $this->assertDatabaseHas('tenants', ['id' => $this->tenant->id]);
    }

    public function test_tenant_without_history_can_still_be_deleted(): void
    {
        $user = User::factory()->create([
            'role' => 'tenant',
            'email' => 'newapplicant@example.com',
        ]);

        $tenant = Tenant::create([
            'user_id' => $user->id,
            'property_id' => $this->property->id,
            'room' => '102',
            'username' => 'newapplicant',
            'password' => \Illuminate\Support\Facades\Hash::make('secret'),
            'name' => 'New Applicant',
            'email' => 'newapplicant@example.com',
            'phone' => '09170000001',
            'status' => 'pending_approval',
            'balance' => 0.00,
            'move_in_date' => null,
        ]);

        Sanctum::actingAs($this->adminUser);
        $this->deleteJson("/api/tenants/{$tenant->id}")->assertStatus(200);

        $this->assertDatabaseMissing('tenants', ['id' => $tenant->id]);
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
