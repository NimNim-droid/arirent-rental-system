<?php

namespace App\Services;

use App\Models\Bill;
use App\Models\Payment;
use App\Repositories\Contracts\BillRepositoryInterface;
use App\Repositories\Contracts\PaymentRepositoryInterface;
use App\Repositories\Contracts\TenantRepositoryInterface;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use InvalidArgumentException;
use RuntimeException;

class XenditService
{
    public function __construct(
        protected BillRepositoryInterface $billRepo,
        protected TenantRepositoryInterface $tenantRepo,
        protected PaymentRepositoryInterface $paymentRepo
    ) {}

    /**
     * Create a Xendit Checkout Invoice for full or partial bill payment.
     *
     * @return array{checkout_url: string, invoice_id: string, external_id: string, amount: float, mode: string}
     */
    public function createCheckoutInvoice(int $billId, float $requestedAmount, string $frontendOrigin, ?string $preferredMethod = null): array
    {
        $bill = $this->billRepo->find($billId);
        if (! $bill) {
            throw new ModelNotFoundException('Bill not found.');
        }

        if ($bill->status === 'paid') {
            throw new InvalidArgumentException('This invoice has already been paid.');
        }

        if ($bill->status === 'voided') {
            throw new InvalidArgumentException('This invoice has been voided.');
        }

        if ($bill->status === 'pending_verification') {
            throw new InvalidArgumentException('A manual payment is currently awaiting landlord verification for this invoice.');
        }

        $remaining = max(0.00, round((float) $bill->total_amount - (float) ($bill->paid_amount ?? 0), 2));
        if ($remaining <= 0) {
            throw new InvalidArgumentException('This invoice has no outstanding balance.');
        }

        $amount = $requestedAmount > 0 ? round($requestedAmount, 2) : $remaining;

        if ($amount <= 0) {
            throw new InvalidArgumentException('Payment amount must be greater than zero.');
        }

        if ($amount > $remaining + 0.001) {
            throw new InvalidArgumentException('Payment amount cannot exceed the remaining balance of ₱' . number_format($remaining, 2));
        }

        $origin = rtrim($frontendOrigin ?: config('app.url', 'http://localhost:5173'), '/');
        $externalId = sprintf('ARIRENT-BILL-%d-%s', $bill->id, strtoupper(bin2hex(random_bytes(4))));

        $secretKey = trim((string) config('services.xendit.secret_key', ''));

        // If a real Xendit API key is configured, call Xendit's v2/invoices endpoint
        if ($secretKey !== '' && $secretKey !== 'demo') {
            $successUrl = "{$origin}/tenant/billing?xendit_status=success&bill_id={$bill->id}&external_id={$externalId}";
            $failureUrl = "{$origin}/tenant/billing?xendit_status=cancelled&bill_id={$bill->id}";

            $payload = [
                'external_id' => $externalId,
                'amount' => $amount,
                'currency' => 'PHP',
                'description' => sprintf(
                    'AriRent Invoice #%d%s',
                    $bill->id,
                    $bill->room ? " (Room {$bill->room})" : ''
                ),
                'invoice_duration' => 86400,
                'success_redirect_url' => $successUrl,
                'failure_redirect_url' => $failureUrl,
            ];

            if ($bill->tenant) {
                $customer = array_filter([
                    'given_names' => $bill->tenant->name ?: 'Tenant',
                    'email' => $bill->tenant->email ?: null,
                ]);
                if (! empty($customer)) {
                    $payload['customer'] = $customer;
                }
            }

            $xenditMethods = $this->resolveXenditPaymentMethods($preferredMethod);
            if (! empty($xenditMethods)) {
                $payload['payment_methods'] = $xenditMethods;
            }

            $response = Http::withBasicAuth($secretKey, '')
                ->timeout(15)
                ->acceptJson()
                ->post('https://api.xendit.co/v2/invoices', $payload);

            // Fallback without payment_methods filter if merchant account doesn't have a specific sub-channel enabled
            if (! $response->successful() && isset($payload['payment_methods'])) {
                unset($payload['payment_methods']);
                $response = Http::withBasicAuth($secretKey, '')
                    ->timeout(15)
                    ->acceptJson()
                    ->post('https://api.xendit.co/v2/invoices', $payload);
            }

            if (! $response->successful()) {
                $errorMsg = $response->json('message') ?? 'Unable to create Xendit checkout session.';
                throw new RuntimeException("Xendit error: {$errorMsg}");
            }

            $xenditData = $response->json();
            $invoiceId = (string) ($xenditData['id'] ?? $externalId);
            $checkoutUrl = (string) ($xenditData['invoice_url'] ?? '');

            if ($checkoutUrl === '') {
                throw new RuntimeException('Xendit did not return a valid checkout URL.');
            }

            $mode = 'live_api';
        } else {
            // Built-in Sandbox Simulator fallback when XENDIT_SECRET_KEY is not set yet
            $invoiceId = 'XND-SIM-' . strtoupper(bin2hex(random_bytes(4)));
            $checkoutUrl = "{$origin}/tenant/billing?xendit_simulator=1&bill_id={$bill->id}&invoice_id={$invoiceId}&amount=" . number_format($amount, 2, '.', '');
            $mode = 'simulator';
        }

        DB::transaction(function () use ($bill, $amount, $invoiceId, $externalId) {
            // Mark any previous unfinished online checkout attempts on this bill as failed
            Payment::where('bill_id', $bill->id)
                ->where('status', 'pending')
                ->where('notes', 'like', 'XENDIT:%')
                ->update(['status' => 'failed']);

            $this->paymentRepo->create([
                'bill_id' => $bill->id,
                'tenant_id' => $bill->tenant_id,
                'amount' => $amount,
                'payment_method' => 'xendit',
                'transaction_reference' => $invoiceId,
                'status' => 'pending',
                'notes' => "XENDIT:{$externalId}",
            ]);
        });

        return [
            'checkout_url' => $checkoutUrl,
            'invoice_id' => $invoiceId,
            'external_id' => $externalId,
            'amount' => $amount,
            'mode' => $mode,
        ];
    }

    /**
     * Verify a Xendit invoice upon return redirect and confirm the payment if paid.
     */
    public function verifyAndConfirmPayment(int $billId, ?string $invoiceId = null, ?string $simulatedChannel = null): Bill
    {
        $bill = $this->billRepo->find($billId);
        if (! $bill) {
            throw new ModelNotFoundException('Bill not found.');
        }

        // Find the most recent Xendit payment record for this bill
        $paymentQuery = Payment::where('bill_id', $billId)
            ->where('notes', 'like', 'XENDIT:%')
            ->latest('id');

        if ($invoiceId) {
            $paymentQuery->where(function ($q) use ($invoiceId) {
                $q->where('transaction_reference', $invoiceId)
                    ->orWhere('notes', "XENDIT:{$invoiceId}");
            });
        }

        $payment = $paymentQuery->first();

        if (! $payment) {
            if ($bill->status === 'paid') {
                return $bill;
            }
            throw new InvalidArgumentException('No matching Xendit checkout session was found for this invoice.');
        }

        // Idempotency: if already confirmed, simply return the updated bill
        if ($payment->status === 'confirmed') {
            return $this->billRepo->find($billId) ?? $bill;
        }

        $secretKey = trim((string) config('services.xendit.secret_key', ''));
        $isSimulatorInvoice = str_starts_with((string) $payment->transaction_reference, 'XND-SIM-');

        if (! $isSimulatorInvoice && $secretKey !== '' && $secretKey !== 'demo') {
            $response = Http::withBasicAuth($secretKey, '')
                ->timeout(15)
                ->acceptJson()
                ->get("https://api.xendit.co/v2/invoices/{$payment->transaction_reference}");

            if (! $response->successful()) {
                throw new RuntimeException('Unable to verify invoice status with Xendit.');
            }

            $invoiceData = $response->json();
            $xenditStatus = strtoupper((string) ($invoiceData['status'] ?? 'PENDING'));

            if (! in_array($xenditStatus, ['PAID', 'SETTLED'], true)) {
                throw new InvalidArgumentException("Payment is not yet completed on Xendit (Status: {$xenditStatus}).");
            }

            $channel = $invoiceData['payment_channel'] ?? null;
            $method = $invoiceData['payment_method'] ?? null;
            $paidAmount = isset($invoiceData['paid_amount']) ? (float) $invoiceData['paid_amount'] : (float) $payment->amount;
            $resolvedMethod = $this->normalizePaymentMethod($channel, $method);
            $channelLabel = $channel ?: ($method ?: 'Xendit Online');
        } else {
            // Simulator confirmation
            $resolvedMethod = $this->normalizePaymentMethod($simulatedChannel, null);
            $paidAmount = (float) $payment->amount;
            $channelLabel = strtoupper($simulatedChannel ?: 'GCASH');
        }

        return $this->confirmPaymentRecord($payment->id, $paidAmount, $resolvedMethod, $channelLabel);
    }

    /**
     * Handle incoming Xendit Invoice Webhook callback (POST /api/webhooks/xendit).
     */
    public function handleWebhook(array $payload, ?string $callbackToken = null): ?Bill
    {
        $expectedToken = trim((string) config('services.xendit.webhook_token', ''));
        if ($expectedToken !== '' && ! hash_equals($expectedToken, (string) $callbackToken)) {
            throw new InvalidArgumentException('Invalid Xendit webhook callback token.');
        }

        $status = strtoupper((string) ($payload['status'] ?? ''));
        $invoiceId = (string) ($payload['id'] ?? '');
        $externalId = (string) ($payload['external_id'] ?? '');

        if ($invoiceId === '' && $externalId === '') {
            throw new InvalidArgumentException('Missing invoice identifier in webhook payload.');
        }

        $payment = Payment::where(function ($query) use ($invoiceId, $externalId) {
            if ($invoiceId !== '') {
                $query->where('transaction_reference', $invoiceId);
            }
            if ($externalId !== '') {
                $query->orWhere('notes', "XENDIT:{$externalId}");
            }
        })->latest('id')->first();

        if (! $payment) {
            return null;
        }

        if (in_array($status, ['EXPIRED', 'FAILED'], true)) {
            if ($payment->status === 'pending') {
                $this->paymentRepo->update($payment, ['status' => 'failed']);
            }
            return $this->billRepo->find((int) $payment->bill_id);
        }

        if (! in_array($status, ['PAID', 'SETTLED'], true)) {
            return $this->billRepo->find((int) $payment->bill_id);
        }

        $channel = $payload['payment_channel'] ?? null;
        $method = $payload['payment_method'] ?? null;
        $paidAmount = isset($payload['paid_amount']) ? (float) $payload['paid_amount'] : (float) $payment->amount;
        $resolvedMethod = $this->normalizePaymentMethod($channel, $method);
        $channelLabel = $channel ?: ($method ?: 'Xendit Online');

        return $this->confirmPaymentRecord($payment->id, $paidAmount, $resolvedMethod, $channelLabel);
    }

    /**
     * Atomically confirm the payment, deduct from the bill's remaining balance, and update tenant balance.
     */
    protected function confirmPaymentRecord(int $paymentId, float $paidAmount, string $resolvedMethod, string $channelLabel): Bill
    {
        return DB::transaction(function () use ($paymentId, $paidAmount, $resolvedMethod, $channelLabel) {
            /** @var Payment|null $payment */
            $payment = Payment::where('id', $paymentId)->lockForUpdate()->first();
            if (! $payment) {
                throw new ModelNotFoundException('Payment record not found.');
            }

            $bill = $this->billRepo->findForUpdate((int) $payment->bill_id);
            if (! $bill) {
                throw new ModelNotFoundException('Bill not found.');
            }

            // Idempotency guard: prevent double-crediting if both webhook and redirect verify fire
            if ($payment->status === 'confirmed') {
                return $bill;
            }

            $totalAmount = (float) $bill->total_amount;
            $currentPaid = (float) ($bill->paid_amount ?? 0);
            $remainingBefore = max(0.00, round($totalAmount - $currentPaid, 2));

            $effectiveAmount = min($remainingBefore, round($paidAmount > 0 ? $paidAmount : (float) $payment->amount, 2));

            $this->paymentRepo->update($payment, [
                'amount' => $effectiveAmount > 0 ? $effectiveAmount : $payment->amount,
                'payment_method' => $resolvedMethod,
                'status' => 'confirmed',
                'paid_at' => now(),
                'notes' => "Paid online via Xendit ({$channelLabel})",
            ]);

            if ($effectiveAmount > 0) {
                $newPaid = round($currentPaid + $effectiveAmount, 2);
                $newRemaining = max(0.00, round($totalAmount - $newPaid, 2));
                $newStatus = ($newRemaining <= 0.001) ? 'paid' : 'partially_paid';

                $bill = $this->billRepo->update($bill->id, [
                    'status' => $newStatus,
                    'paid_amount' => $newPaid,
                    'remaining_balance' => $newRemaining,
                    'gcash_ref' => $payment->transaction_reference,
                    'payment_date' => now(),
                    'approved_date' => now(),
                    'reject_reason' => null,
                ]);

                $this->tenantRepo->decrementBalance((int) $bill->tenant_id, $effectiveAmount);
            }

            Cache::forget('admin_stats_all');
            Cache::forget("tenant_dashboard_{$bill->tenant_id}");

            return $bill;
        });
    }

    /**
     * Map a tenant's selected payment option in AriRent to Xendit's payment_methods filter.
     *
     * @return array<int, string>
     */
    protected function resolveXenditPaymentMethods(?string $preferredMethod): array
    {
        return match (strtolower((string) $preferredMethod)) {
            'gcash' => ['GCASH'],
            'maya', 'paymaya' => ['PAYMAYA'],
            'qrph' => ['QRPH'],
            'card' => ['CREDIT_CARD'],
            'bank_transfer' => ['DD_BPI', 'DD_UBP', 'DD_RCBC', 'DD_CBC', 'BDO', 'BPI'],
            default => [],
        };
    }

    /**
     * Normalize Xendit's payment_channel / payment_method codes to AriRent payment_method values.
     */
    public function normalizePaymentMethod(?string $channel, ?string $method): string
    {
        $upperChannel = strtoupper((string) $channel);
        $upperMethod = strtoupper((string) $method);

        if (str_contains($upperChannel, 'GCASH')) {
            return 'gcash';
        }

        if (str_contains($upperChannel, 'MAYA') || str_contains($upperChannel, 'PAYMAYA')) {
            return 'maya';
        }

        if (str_contains($upperChannel, 'QRPH') || str_contains($upperChannel, 'QR_PH') || $upperMethod === 'QR_CODE') {
            return 'qrph';
        }

        if (str_contains($upperChannel, 'CARD') || $upperMethod === 'CREDIT_CARD' || $upperMethod === 'DEBIT_CARD') {
            return 'card';
        }

        if (
            in_array($upperChannel, ['BDO', 'BPI', 'UBP', 'UNIONBANK', 'RCBC', 'CHINABANK', 'METROBANK', 'LANDBANK', 'INSTAPAY', 'PESONET'], true)
            || in_array($upperMethod, ['BANK_TRANSFER', 'DIRECT_DEBIT', 'ONLINE_BANKING'], true)
        ) {
            return 'bank_transfer';
        }

        if (in_array($upperChannel, ['GRABPAY', 'SHOPEEPAY'], true)) {
            return strtolower($upperChannel);
        }

        return 'xendit';
    }
}

