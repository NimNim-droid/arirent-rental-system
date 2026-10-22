<?php

namespace App\Services;

use App\Models\Bill;
use App\Models\Payment;
use App\Repositories\Contracts\BillRepositoryInterface;
use App\Repositories\Contracts\TenantRepositoryInterface;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use InvalidArgumentException;

class PaymentService
{
    public function __construct(
        protected BillRepositoryInterface $billRepo,
        protected TenantRepositoryInterface $tenantRepo
    ) {}

    /**
     * Submit a payment for verification (supports full or partial payments).
     */
    public function submitPayment(int $billId, array $data, ?UploadedFile $receipt = null): Bill
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
            throw new InvalidArgumentException('A payment is already awaiting verification for this invoice.');
        }

        $paid = (float) ($bill->paid_amount ?? 0);
        $total = (float) $bill->total_amount;
        $remaining = ((float) $bill->remaining_balance > 0)
            ? (float) $bill->remaining_balance
            : max(0.00, $total - $paid);

        $amount = isset($data['amount']) && (float) $data['amount'] > 0
            ? (float) $data['amount']
            : $remaining;

        if ($amount > $remaining) {
            throw new InvalidArgumentException('Payment amount cannot exceed the remaining balance of ₱' . number_format($remaining, 2));
        }

        $receiptUrl = $bill->receipt_url;

        if ($receipt) {
            if ($bill->receipt_url && str_starts_with($bill->receipt_url, '/storage/')) {
                $oldPath = str_replace('/storage/', '', $bill->receipt_url);
                Storage::disk('public')->delete($oldPath);
            }
            $path = $receipt->store('receipts', 'public');
            $receiptUrl = '/storage/' . $path;
        }

        return DB::transaction(function () use ($billId, $bill, $data, $amount, $receiptUrl) {
            Payment::create([
                'bill_id' => $bill->id,
                'tenant_id' => $bill->tenant_id,
                'amount' => $amount,
                'payment_method' => $data['payment_method'] ?? 'gcash',
                'transaction_reference' => $data['gcash_ref'],
                'status' => 'pending',
                'receipt_url' => $receiptUrl,
                'notes' => $data['notes'] ?? null,
            ]);

            $bill = $this->billRepo->update($billId, [
                'status' => 'pending_verification',
                'gcash_ref' => $data['gcash_ref'],
                'receipt_url' => $receiptUrl,
                'notes' => $data['notes'] ?? $bill->notes,
                'payment_date' => now(),
                'reject_reason' => null,
            ]);

            Cache::forget('admin_stats_all');
            Cache::forget("tenant_dashboard_{$bill->tenant_id}");

            return $bill;
        });
    }

    /**
     * Landlord verifies or rejects a submitted payment.
     */
    public function verifyPayment(int $billId, bool $approved, ?string $rejectReason = null): Bill
    {
        $bill = $this->billRepo->find($billId);
        if (! $bill) {
            throw new ModelNotFoundException('Bill not found.');
        }

        if ($bill->status !== 'pending_verification') {
            throw new InvalidArgumentException('This bill cannot be verified. Current status: ' . $bill->status);
        }

        return DB::transaction(function () use ($billId, $bill, $approved, $rejectReason) {
            $pendingPayment = Payment::where('bill_id', $billId)
                ->where('status', 'pending')
                ->latest()
                ->first();

            $totalAmount = (float) $bill->total_amount;
            $currentPaid = (float) ($bill->paid_amount ?? 0);
            $remainingBefore = ((float) $bill->remaining_balance > 0)
                ? (float) $bill->remaining_balance
                : max(0.00, $totalAmount - $currentPaid);

            if ($approved) {
                $paymentAmount = $pendingPayment
                    ? (float) $pendingPayment->amount
                    : $remainingBefore;

                if ($pendingPayment) {
                    $pendingPayment->update([
                        'status' => 'confirmed',
                        'paid_at' => now(),
                    ]);
                }

                $newPaid = $currentPaid + $paymentAmount;
                $newRemaining = max(0.00, round($totalAmount - $newPaid, 2));

                $newStatus = ($newRemaining <= 0.001) ? 'paid' : 'partially_paid';

                $bill = $this->billRepo->update($billId, [
                    'status' => $newStatus,
                    'paid_amount' => $newPaid,
                    'remaining_balance' => $newRemaining,
                    'approved_date' => now(),
                    'reject_reason' => null,
                ]);

                $tenant = $this->tenantRepo->find((int) $bill->tenant_id);
                if ($tenant) {
                    $tenant->decrement('balance', min((float) $tenant->balance, $paymentAmount));
                }
            } else {
                if ($pendingPayment) {
                    $pendingPayment->update(['status' => 'failed']);
                }

                // If already partially paid previously, restore to partially_paid; otherwise unpaid
                $revertStatus = ($currentPaid > 0) ? 'partially_paid' : 'unpaid';

                $bill = $this->billRepo->update($billId, [
                    'status' => $revertStatus,
                    'reject_reason' => $rejectReason ?? 'Invalid or unverified GCash reference number.',
                ]);
            }

            Cache::forget('admin_stats_all');
            Cache::forget("tenant_dashboard_{$bill->tenant_id}");

            return $bill;
        });
    }

    /**
     * Record a direct offline payment (Cash, Bank Transfer, Manual GCash) by Admin.
     */
    public function recordDirectPayment(int $billId, array $data): Bill
    {
        $bill = $this->billRepo->find($billId);
        if (! $bill) {
            throw new ModelNotFoundException('Bill not found.');
        }

        if (in_array($bill->status, ['paid', 'voided'])) {
            throw new InvalidArgumentException("Cannot apply payment to a bill that is already {$bill->status}.");
        }

        $totalAmount = (float) $bill->total_amount;
        $currentPaid = (float) ($bill->paid_amount ?? 0);
        $remaining = ((float) $bill->remaining_balance > 0)
            ? (float) $bill->remaining_balance
            : max(0.00, $totalAmount - $currentPaid);

        $amount = (float) ($data['amount'] ?? $remaining);

        if ($amount <= 0) {
            throw new InvalidArgumentException('Payment amount must be greater than zero.');
        }

        if ($amount > $remaining) {
            throw new InvalidArgumentException('Payment amount cannot exceed the remaining balance of ₱' . number_format($remaining, 2));
        }

        return DB::transaction(function () use ($billId, $bill, $data, $amount) {
            $payment = Payment::create([
                'bill_id' => $bill->id,
                'tenant_id' => $bill->tenant_id,
                'amount' => $amount,
                'payment_method' => $data['payment_method'] ?? 'cash',
                'transaction_reference' => $data['transaction_reference'] ?? ('CASH-' . strtoupper(bin2hex(random_bytes(4)))),
                'status' => 'confirmed',
                'paid_at' => now(),
                'notes' => $data['notes'] ?? 'Direct payment recorded by Admin',
            ]);

            $currentPaid = (float) ($bill->paid_amount ?? 0);
            $newPaid = $currentPaid + $amount;
            $totalAmount = (float) $bill->total_amount;
            $newRemaining = max(0.00, round($totalAmount - $newPaid, 2));

            $newStatus = ($newRemaining <= 0.001) ? 'paid' : 'partially_paid';

            $bill = $this->billRepo->update($billId, [
                'status' => $newStatus,
                'paid_amount' => $newPaid,
                'remaining_balance' => $newRemaining,
                'payment_date' => now(),
                'approved_date' => now(),
                'reject_reason' => null,
            ]);

            $tenant = $this->tenantRepo->find((int) $bill->tenant_id);
            if ($tenant) {
                $tenant->decrement('balance', min((float) $tenant->balance, $amount));
            }

            Cache::forget('admin_stats_all');
            Cache::forget("tenant_dashboard_{$bill->tenant_id}");

            return $bill;
        });
    }
}
