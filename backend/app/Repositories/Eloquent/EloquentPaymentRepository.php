<?php

namespace App\Repositories\Eloquent;

use App\Models\Payment;
use App\Repositories\Contracts\PaymentRepositoryInterface;

class EloquentPaymentRepository implements PaymentRepositoryInterface
{
    public function findForUpdate(int $id): ?Payment
    {
        return Payment::where('id', $id)->lockForUpdate()->first();
    }

    public function existsByReference(string $reference): bool
    {
        return Payment::where('transaction_reference', $reference)->exists();
    }

    public function findByReferenceForUpdate(string $reference): ?Payment
    {
        return Payment::where('transaction_reference', $reference)
            ->lockForUpdate()
            ->first();
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

    public function markPendingXenditFailedForBill(int $billId): int
    {
        return Payment::where('bill_id', $billId)
            ->where('status', 'pending')
            ->where('notes', 'like', 'XENDIT:%')
            ->update(['status' => 'failed']);
    }

    public function findLatestXenditForBill(int $billId, ?string $lookupId = null): ?Payment
    {
        $query = Payment::where('bill_id', $billId)
            ->where('notes', 'like', 'XENDIT:%')
            ->latest('id');

        if ($lookupId) {
            $query->where(function ($q) use ($lookupId) {
                $q->where('transaction_reference', $lookupId)
                    ->orWhere('notes', "XENDIT:{$lookupId}");
            });
        }

        return $query->first();
    }

    public function findLatestXenditByIdentifiers(?string $invoiceId, ?string $externalId): ?Payment
    {
        return Payment::where(function ($query) use ($invoiceId, $externalId) {
            if ($invoiceId !== null && $invoiceId !== '') {
                $query->where('transaction_reference', $invoiceId);
            }
            if ($externalId !== null && $externalId !== '') {
                $query->orWhere('notes', "XENDIT:{$externalId}");
            }
        })->latest('id')->first();
    }

    public function hasForBill(int $billId): bool
    {
        return Payment::where('bill_id', $billId)->exists();
    }
}
