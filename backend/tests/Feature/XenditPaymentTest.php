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
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class XenditPaymentTest extends TestCase
{
    use RefreshDatabase;

    private User $tenantUser;
    private Tenant $tenant;
    private Bill $bill;

    protected function setUp(): void
    {
        parent::setUp();

        Setting::create([
            'elec_rate' => 12.50,
            'water_rate' => 500.00,
            'gcash_name' => 'AriRent Management',
            'gcash_number' => '0917-123-4567',
        ]);

        $property = Property::create([
            'name' => 'AriRent Residences',
            'city' => 'Makati',
            'address' => 'Ayala Ave',
        ]);

        Room::create([
            'property_id' => $property->id,
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
            'property_id' => $property->id,
            'room' => '101',
            'username' => 'alicer101',
            'name' => 'Alice Rivera',
            'email' => 'alice@example.com',
            'phone' => '09171234567',
            'password' => Hash::make('secret'),
            'status' => 'active',
            'balance' => 10500.00,
            'water_rate' => 500.00,
            'move_in_date' => Carbon::parse('2026-01-05'),
        ]);

        $this->bill = Bill::create([
            'tenant_id' => $this->tenant->id,
            'rent' => 10000.00,
            'electricity' => 0.00,
            'elec_usage' => 0.00,
            'water' => 500.00,
            'late_fee' => 0.00,
            'total_amount' => 10500.00,
            'paid_amount' => 0.00,
            'remaining_balance' => 10500.00,
            'date' => '2026-10-05',
            'due_date' => '2026-10-12',
            'status' => 'unpaid',
        ]);
    }

    public function test_tenant_can_create_and_verify_live_xendit_checkout_for_partial_and_full_payments(): void
    {
        Config::set('services.xendit.secret_key', 'xnd_development_test_secret_123');

        Http::fake([
            'https://api.xendit.co/v2/invoices' => Http::response([
                'id' => 'xnd_inv_partial_001',
                'invoice_url' => 'https://checkout-staging.xendit.co/v2/xnd_inv_partial_001',
                'status' => 'PENDING',
            ], 200),
            'https://api.xendit.co/v2/invoices/xnd_inv_partial_001' => Http::response([
                'id' => 'xnd_inv_partial_001',
                'status' => 'PAID',
                'paid_amount' => 5000.00,
                'payment_channel' => 'MAYA',
                'payment_method' => 'EWALLET',
            ], 200),
        ]);

        Sanctum::actingAs($this->tenantUser);

        $checkoutRes = $this->postJson("/api/bills/{$this->bill->id}/xendit/checkout", [
            'amount' => 5000.00,
            'redirect_origin' => 'https://arirent.vercel.app',
        ]);

        $checkoutRes->assertStatus(200)
            ->assertJsonPath('mode', 'live_api')
            ->assertJsonPath('invoice_id', 'xnd_inv_partial_001')
            ->assertJsonPath('checkout_url', 'https://checkout-staging.xendit.co/v2/xnd_inv_partial_001');

        $externalId = $checkoutRes->json('external_id');

        // Confirm on return redirect
        $verifyRes = $this->postJson("/api/bills/{$this->bill->id}/xendit/verify", [
            'external_id' => $externalId,
        ]);

        $verifyRes->assertStatus(200)
            ->assertJsonPath('data.status', 'partially_paid')
            ->assertJsonPath('data.paid_amount', 5000)
            ->assertJsonPath('data.remaining_balance', 5500);

        $payment = Payment::where('transaction_reference', 'xnd_inv_partial_001')->firstOrFail();
        $this->assertSame('confirmed', $payment->status);
        $this->assertSame('maya', $payment->payment_method);

        // Idempotency check: if Xendit webhook also fires for the same invoice, it must not double-deduct
        $webhookRes = $this->postJson('/api/webhooks/xendit', [
            'id' => 'xnd_inv_partial_001',
            'external_id' => $externalId,
            'status' => 'PAID',
            'paid_amount' => 5000.00,
            'payment_channel' => 'MAYA',
        ]);

        $webhookRes->assertStatus(200);

        $this->bill->refresh();
        $this->tenant->refresh();
        $this->assertEquals(5000.00, (float) $this->bill->paid_amount);
        $this->assertEquals(5500.00, (float) $this->bill->remaining_balance);
        $this->assertEquals(5500.00, (float) $this->tenant->balance);
    }

    public function test_simulator_mode_works_when_xendit_secret_key_is_not_configured(): void
    {
        Config::set('services.xendit.secret_key', '');

        Sanctum::actingAs($this->tenantUser);

        $checkoutRes = $this->postJson("/api/bills/{$this->bill->id}/xendit/checkout", [
            'amount' => 10500.00,
            'redirect_origin' => 'http://localhost:5173',
        ]);

        $checkoutRes->assertStatus(200)
            ->assertJsonPath('mode', 'simulator');

        $invoiceId = $checkoutRes->json('invoice_id');

        $verifyRes = $this->postJson("/api/bills/{$this->bill->id}/xendit/verify", [
            'invoice_id' => $invoiceId,
            'payment_channel' => 'BDO',
        ]);

        $verifyRes->assertStatus(200)
            ->assertJsonPath('data.status', 'paid')
            ->assertJsonPath('data.remaining_balance', 0);

        $payment = Payment::where('transaction_reference', $invoiceId)->firstOrFail();
        $this->assertSame('confirmed', $payment->status);
        $this->assertSame('bank_transfer', $payment->payment_method);
    }
}

