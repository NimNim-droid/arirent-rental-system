<?php

namespace App\Services;

use App\Models\Bill;
use App\Models\Payment;
use App\Repositories\Contracts\BillRepositoryInterface;
use App\Repositories\Contracts\TenantRepositoryInterface;
use App\Support\PrivateFile;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
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
        $newReceiptUrl = $receipt ? PrivateFile::store($receipt, 'receipts') : null;
        $oldReceiptUrl = null;

        try {
            $bill = DB::transaction(function () use ($billId, $data, $newReceiptUrl, &$oldReceiptUrl) {
                $bill = $this->billRepo->findForUpdate($billId);
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

                $remaining = max(0.00, round((float) $bill->total_amount - (float) ($bill->paid_amount ?? 0), 2));

                if ($remaining <= 0) {
                    throw new InvalidArgumentException('This invoice has no outstanding balance.');
                }

                $amount = isset($data['amount']) && (float) $data['amount'] > 0
                    ? (float) $data['amount']
                    : $remaining;

                if ($amount > $remaining) {
                    throw new InvalidArgumentException('Payment amount cannot exceed the remaining balance of ₱' . number_format($remaining, 2));
                }

                $reference = (string) $data['gcash_ref'];

                if (Payment::where('transaction_reference', $reference)->exists()) {
                    throw new InvalidArgumentException('That payment reference has already been used.');
                }

                $oldReceiptUrl = $bill->receipt_url;
                $receiptUrl = $newReceiptUrl ?: $bill->receipt_url;

                Payment::create([
                    'bill_id' => $bill->id,
                    'tenant_id' => $bill->tenant_id,
                    'amount' => $amount,
                    'payment_method' => $data['payment_method'] ?? 'gcash',
                    'transaction_reference' => $reference,
                    'status' => 'pending',
                    'receipt_url' => $receiptUrl,
                    'notes' => $data['notes'] ?? null,
                ]);

                $bill = $this->billRepo->update($billId, [
                    'status' => 'pending_verification',
                    'gcash_ref' => $reference,
                    'receipt_url' => $receiptUrl,
                    'notes' => $data['notes'] ?? $bill->notes,
                    'payment_date' => now(),
                    'reject_reason' => null,
                ]);

                Cache::forget('admin_stats_all');
                Cache::forget("tenant_dashboard_{$bill->tenant_id}");

                return $bill;
            });
        } catch (\Throwable $e) {
            if ($newReceiptUrl) {
                PrivateFile::delete($newReceiptUrl);
            }
            throw $e;
        }

        if ($newReceiptUrl && $oldReceiptUrl && $oldReceiptUrl !== $newReceiptUrl) {
            PrivateFile::delete($oldReceiptUrl);
        }

        return $bill;
    }

    /**
     * Landlord verifies or rejects a submitted payment.
     */
    public function verifyPayment(int $billId, bool $approved, ?string $rejectReason = null): Bill
    {
        return DB::transaction(function () use ($billId, $approved, $rejectReason) {
            $bill = $this->billRepo->findForUpdate($billId);
            if (! $bill) {
                throw new ModelNotFoundException('Bill not found.');
            }

            if ($bill->status !== 'pending_verification') {
                throw new InvalidArgumentException('This bill cannot be verified. Current status: ' . $bill->status);
            }

            $pendingPayment = Payment::where('bill_id', $billId)
                ->where('status', 'pending')
                ->lockForUpdate()
                ->latest()
                ->first();

            $totalAmount = (float) $bill->total_amount;
            $currentPaid = (float) ($bill->paid_amount ?? 0);
            $remainingBefore = max(0.00, round($totalAmount - $currentPaid, 2));

            if ($approved) {
                if (! $pendingPayment) {
                    throw new InvalidArgumentException('No pending payment was found for this invoice.');
                }

                $paymentAmount = round((float) $pendingPayment->amount, 2);

                if ($paymentAmount <= 0) {
                    throw new InvalidArgumentException('The pending payment amount is invalid.');
                }

                if ($paymentAmount > $remainingBefore) {
                    throw new InvalidArgumentException('The payment amount exceeds the remaining balance. Adjust the invoice or reject the payment.');
                }

                $pendingPayment->update([
                    'status' => 'confirmed',
                    'paid_at' => now(),
                ]);

                $newPaid = round($currentPaid + $paymentAmount, 2);
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
        return DB::transaction(function () use ($billId, $data) {
            $bill = $this->billRepo->findForUpdate($billId);
            if (! $bill) {
                throw new ModelNotFoundException('Bill not found.');
            }

            if (in_array($bill->status, ['paid', 'voided'], true)) {
                throw new InvalidArgumentException("Cannot apply payment to a bill that is already {$bill->status}.");
            }

            // A tenant-submitted payment awaiting review already holds this
            // invoice's remaining balance. Resolve it before recording cash.
            if ($bill->status === 'pending_verification') {
                throw new InvalidArgumentException('A payment is already awaiting verification for this invoice.');
            }

            $remaining = max(0.00, round((float) $bill->total_amount - (float) ($bill->paid_amount ?? 0), 2));

            if ($remaining <= 0) {
                throw new InvalidArgumentException('This invoice has no outstanding balance.');
            }

            $amount = (float) ($data['amount'] ?? $remaining);

            if ($amount <= 0) {
                throw new InvalidArgumentException('Payment amount must be greater than zero.');
            }

            if ($amount > $remaining) {
                throw new InvalidArgumentException('Payment amount cannot exceed the remaining balance of ₱' . number_format($remaining, 2));
            }

            $reference = $data['transaction_reference'] ?? ('CASH-' . strtoupper(bin2hex(random_bytes(4))));

            if (Payment::where('transaction_reference', $reference)->exists()) {
                throw new InvalidArgumentException('That payment reference has already been used.');
            }

            Payment::create([
                'bill_id' => $bill->id,
                'tenant_id' => $bill->tenant_id,
                'amount' => $amount,
                'payment_method' => $data['payment_method'] ?? 'cash',
                'transaction_reference' => $reference,
                'status' => 'confirmed',
                'paid_at' => now(),
                'notes' => $data['notes'] ?? 'Direct payment recorded by Admin',
            ]);

            $newPaid = round((float) ($bill->paid_amount ?? 0) + $amount, 2);
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
