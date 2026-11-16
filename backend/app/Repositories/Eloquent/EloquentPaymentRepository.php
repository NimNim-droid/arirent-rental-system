<?php

namespace App\Repositories\Eloquent;

use App\Models\Payment;
use App\Repositories\Contracts\PaymentRepositoryInterface;

class EloquentPaymentRepository implements PaymentRepositoryInterface
{
    public function existsByReference(string $reference): bool
    {
        return Payment::where('transaction_reference', $reference)->exists();
    }

    public function findPendingForBillForUpdate(int $billId): ?Payment
    {
        return Payment::where('bill_id', $billId)
            ->where('status', 'pending')
            ->lockForUpdate()
            ->latest()
            ->first();
    }

    public function create(array $attributes): Payment
    {
        return Payment::create($attributes);
    }

    public function update(Payment $payment, array $attributes): Payment
    {
        $payment->update($attributes);

        return $payment;
    }

    public function markPendingFailedForBill(int $billId): int
    {
        return Payment::where('bill_id', $billId)
            ->where('status', 'pending')
            ->update(['status' => 'failed']);
    }

    public function hasForBill(int $billId): bool
    {
        return Payment::where('bill_id', $billId)->exists();
    }
}
