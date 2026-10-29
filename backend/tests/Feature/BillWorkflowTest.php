<?php

namespace Tests\Feature;

use App\Models\Bill;
use App\Models\Payment;
use App\Models\Property;
use App\Models\Room;
use App\Models\Setting;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BillWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private User $adminUser;
    private User $tenantUser;
    private Tenant $tenant;
    private Property $property;
    private Room $room;

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

        $this->room = Room::create([
            'property_id' => $this->property->id,
            'room_number' => '101',
            'rent' => 10000.00,
            'status' => 'occupied',
        ]);

        $this->tenantUser = User::create([
            'name' => 'Alice Rivera',
            'email' => 'alice@example.com',
            'password' => Hash::make('secret'),
            'role' => 'tenant',
        ]);

        $this->tenant = Tenant::create([
            'user_id' => $this->tenantUser->id,
            'property_id' => $this->property->id,
            'room' => '101',
            'username' => 'alicer101',
            'name' => 'Alice Rivera',
            'email' => 'alice@example.com',
            'phone' => '09171234567',
            'password' => Hash::make('secret'),
            'status' => 'active',
            'balance' => 0.00,
            'water_rate' => 500.00,
            'move_in_date' => Carbon::parse('2026-01-05'),
        ]);
    }

    public function test_batch_generate_bills_creates_invoices_and_updates_balances(): void
    {
        Sanctum::actingAs($this->adminUser);

        $response = $this->postJson('/api/bills/generate', [
            'date' => '2026-02-05',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'generated' => 1,
                'skipped' => 0,
            ]);

        $this->assertDatabaseHas('bills', [
            'tenant_id' => $this->tenant->id,
            'rent' => 10000.00,
            'water' => 500.00,
            'total_amount' => 10500.00,
            'status' => 'unpaid',
        ]);

        // Verify tenant balance increased by the invoice amount
        $this->assertEquals(10500.00, (float) $this->tenant->fresh()->balance);
    }

    public function test_generating_bills_twice_in_the_same_month_does_not_duplicate(): void
    {
        Sanctum::actingAs($this->adminUser);

        $this->postJson('/api/bills/generate', ['date' => '2026-02-05'])
            ->assertStatus(200)
            ->assertJson(['generated' => 1, 'skipped' => 0]);

        $this->postJson('/api/bills/generate', ['date' => '2026-02-20'])
            ->assertStatus(200)
            ->assertJson(['generated' => 0, 'skipped' => 1]);

        $this->assertSame(1, Bill::where('tenant_id', $this->tenant->id)->count());
        $this->assertEquals(10500.00, (float) $this->tenant->fresh()->balance);
    }

    public function test_complete_payment_and_approval_workflow(): void
    {
        // 1. Create an unpaid bill of ₱10,500
        $bill = Bill::create([
            'tenant_id' => $this->tenant->id,
            'rent' => 10000.00,
            'electricity' => 0.00,
            'water' => 500.00,
            'total_amount' => 10500.00,
            'date' => '2026-02-05',
            'due_date' => '2026-02-10',
            'status' => 'unpaid',
        ]);
        $this->tenant->update(['balance' => 10500.00]);

        // 2. Tenant submits GCash payment
        Sanctum::actingAs($this->tenantUser);
        $payResponse = $this->postJson("/api/bills/{$bill->id}/pay", [
            'gcash_ref' => '987654321012',
            'notes' => 'Paid via GCash app',
        ]);

        $payResponse->assertStatus(200)
            ->assertJson([
                'message' => 'Payment submitted successfully. Awaiting landlord verification.',
                'data' => [
                    'status' => 'pending_verification',
                    'gcash_ref' => '987654321012',
                ],
            ]);

        $this->assertEquals('pending_verification', $bill->fresh()->status);

        // 3. Landlord verifies and approves payment
        Sanctum::actingAs($this->adminUser);
        $verifyResponse = $this->postJson("/api/bills/{$bill->id}/verify", [
            'approved' => true,
        ]);

        $verifyResponse->assertStatus(200)
            ->assertJson([
                'message' => 'Payment approved successfully. Bill marked as paid.',
                'data' => [
                    'status' => 'paid',
                ],
            ]);

        // Bill must be paid and tenant balance must now be 0
        $this->assertEquals('paid', $bill->fresh()->status);
        $this->assertEquals(0.00, (float) $this->tenant->fresh()->balance);
    }

    public function test_payment_rejection_reverts_bill_to_unpaid(): void
    {
        $bill = Bill::create([
            'tenant_id' => $this->tenant->id,
            'rent' => 10000.00,
            'electricity' => 0.00,
            'water' => 500.00,
            'total_amount' => 10500.00,
            'date' => '2026-02-05',
            'due_date' => '2026-02-10',
            'status' => 'pending_verification',
            'gcash_ref' => '0000000000',
        ]);
        $this->tenant->update(['balance' => 10500.00]);

        Sanctum::actingAs($this->adminUser);
        $rejectResponse = $this->postJson("/api/bills/{$bill->id}/verify", [
            'approved' => false,
            'reject_reason' => 'GCash reference number not found in GCash merchant account.',
        ]);

        $rejectResponse->assertStatus(200)
            ->assertJson([
                'message' => 'Payment rejected. Bill returned to unpaid status.',
                'data' => [
                    'status' => 'unpaid',
                    'reject_reason' => 'GCash reference number not found in GCash merchant account.',
                ],
            ]);

        // Balance remains unchanged (debt still owed)
        $this->assertEquals('unpaid', $bill->fresh()->status);
        $this->assertEquals(10500.00, (float) $this->tenant->fresh()->balance);
    }

    public function test_voiding_bill_relieves_tenant_debt(): void
    {
        $bill = Bill::create([
            'tenant_id' => $this->tenant->id,
            'rent' => 10000.00,
            'electricity' => 0.00,
            'water' => 500.00,
            'total_amount' => 10500.00,
            'date' => '2026-02-05',
            'due_date' => '2026-02-10',
            'status' => 'unpaid',
        ]);
        $this->tenant->update(['balance' => 10500.00]);

        Sanctum::actingAs($this->adminUser);
        $updateResponse = $this->postJson("/api/bills/{$bill->id}/void");

        $updateResponse->assertStatus(200)
            ->assertJson([
                'data' => [
                    'status' => 'voided',
                ],
            ]);

        $this->assertEquals('voided', $bill->fresh()->status);
        $this->assertEquals(0.00, (float) $this->tenant->fresh()->balance);
    }

    public function test_direct_status_edits_are_rejected(): void
    {
        $bill = Bill::create([
            'tenant_id' => $this->tenant->id,
            'rent' => 10000.00,
            'total_amount' => 10000.00,
            'date' => '2026-02-05',
            'due_date' => '2026-02-10',
            'status' => 'unpaid',
        ]);
        $this->tenant->update(['balance' => 10000.00]);

        Sanctum::actingAs($this->adminUser);

        $this->putJson("/api/bills/{$bill->id}", ['status' => 'paid'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('status');

        $this->putJson("/api/bills/{$bill->id}", ['status' => 'voided'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('status');

        $this->assertEquals('unpaid', $bill->fresh()->status);
        $this->assertEquals(0.00, (float) $bill->fresh()->paid_amount);
        $this->assertEquals(10000.00, (float) $bill->fresh()->remaining_balance);
    }

    public function test_invoice_with_recorded_payment_cannot_be_voided(): void
    {
        $bill = Bill::create([
            'tenant_id' => $this->tenant->id,
            'rent' => 10000.00,
            'total_amount' => 10000.00,
            'paid_amount' => 3000.00,
            'date' => '2026-02-05',
            'due_date' => '2026-02-10',
            'status' => 'partially_paid',
        ]);
        $this->tenant->update(['balance' => 7000.00]);

        Sanctum::actingAs($this->adminUser);

        $this->postJson("/api/bills/{$bill->id}/void")
            ->assertStatus(422)
            ->assertJson([
                'message' => 'Invoices with recorded payments cannot be voided. Refund or reverse the payment first.',
            ]);

        $this->assertEquals('partially_paid', $bill->fresh()->status);
        $this->assertEquals(7000.00, (float) $this->tenant->fresh()->balance);
    }

    public function test_invoice_with_payment_history_cannot_be_deleted(): void
    {
        $bill = Bill::create([
            'tenant_id' => $this->tenant->id,
            'rent' => 10000.00,
            'total_amount' => 10000.00,
            'paid_amount' => 3000.00,
            'date' => '2026-02-05',
            'due_date' => '2026-02-10',
            'status' => 'partially_paid',
        ]);

        Payment::create([
            'bill_id' => $bill->id,
            'tenant_id' => $this->tenant->id,
            'amount' => 3000.00,
            'payment_method' => 'cash',
            'transaction_reference' => 'CASH-DELETE-GUARD',
            'status' => 'confirmed',
            'paid_at' => now(),
        ]);

        Sanctum::actingAs($this->adminUser);

        $this->deleteJson("/api/bills/{$bill->id}")
            ->assertStatus(422)
            ->assertJson([
                'message' => 'Invoices with recorded payments cannot be deleted. Void the invoice instead.',
            ]);

        $this->assertDatabaseHas('bills', ['id' => $bill->id]);
        $this->assertDatabaseHas('payments', ['bill_id' => $bill->id]);
    }

    public function test_cannot_pay_already_paid_or_voided_bill(): void
    {
        $paidBill = Bill::create([
            'tenant_id' => $this->tenant->id,
            'rent' => 10000.00,
            'total_amount' => 10000.00,
            'date' => '2026-02-05',
            'due_date' => '2026-02-10',
            'status' => 'paid',
        ]);

        Sanctum::actingAs($this->tenantUser);
        $responsePaid = $this->postJson("/api/bills/{$paidBill->id}/pay", [
            'gcash_ref' => '123456789012',
        ]);

        $responsePaid->assertStatus(422)
            ->assertJson([
                'message' => 'This invoice has already been paid.',
            ]);

        $voidedBill = Bill::create([
            'tenant_id' => $this->tenant->id,
            'rent' => 10000.00,
            'total_amount' => 10000.00,
            'date' => '2026-02-05',
            'due_date' => '2026-02-10',
            'status' => 'voided',
        ]);

        $responseVoided = $this->postJson("/api/bills/{$voidedBill->id}/pay", [
            'gcash_ref' => '123456789012',
        ]);

        $responseVoided->assertStatus(422)
            ->assertJson([
                'message' => 'This invoice has been voided.',
            ]);
    }

    public function test_electricity_reading_is_only_billed_once_across_months(): void
    {
        Sanctum::actingAs($this->adminUser);

        // 1. Generate bills for Feb
        $this->postJson('/api/bills/generate', ['date' => '2026-02-05'])->assertStatus(200);
        $febBill = Bill::where('tenant_id', $this->tenant->id)->whereDate('date', '2026-02-05')->first();
        $this->assertNotNull($febBill);
        $this->assertEquals(0.00, (float) $febBill->electricity);

        // 2. Record reading for Feb (50 kWh * 12.50 = 625.00)
        $readingRes = $this->postJson('/api/readings', [
            'tenant_id' => $this->tenant->id,
            'prev_reading' => 100,
            'curr_reading' => 150,
            'date' => '2026-02-20',
        ]);
        $readingRes->assertStatus(201);
        $readingId = $readingRes->json('data.id');

        // Verify the Feb bill was updated with 625.00 electricity and reading was linked to Feb bill
        $this->assertEquals(625.00, (float) $febBill->fresh()->electricity);
        $this->assertDatabaseHas('utility_readings', [
            'id' => $readingId,
            'bill_id' => $febBill->id,
        ]);

        // 3. Generate bills for March (without entering any new reading)
        $this->postJson('/api/bills/generate', ['date' => '2026-03-05'])->assertStatus(200);
        $marBill = Bill::where('tenant_id', $this->tenant->id)->whereDate('date', '2026-03-05')->first();
        $this->assertNotNull($marBill);

        // March bill MUST have 0 electricity because the Feb reading was already attached to Feb bill
        $this->assertEquals(0.00, (float) $marBill->electricity);
        $this->assertEquals(10000.00, (float) $marBill->rent);
        $this->assertEquals(500.00, (float) $marBill->water);
        $this->assertEquals(10750.00, (float) $marBill->total_amount); // 10000 rent + 500 water + 250 overdue late fee
    }
}
