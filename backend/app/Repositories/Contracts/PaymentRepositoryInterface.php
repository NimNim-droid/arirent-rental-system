<?php

namespace App\Repositories\Contracts;

use App\Models\Payment;

interface PaymentRepositoryInterface
{
    public function findForUpdate(int $id): ?Payment;

    public function existsByReference(string $reference): bool;

    public function findByReferenceForUpdate(string $reference): ?Payment;

    public function findPendingForBillForUpdate(int $billId): ?Payment;

    public function create(array $attributes): Payment;

    public function update(Payment $payment, array $attributes): Payment;

    public function markPendingFailedForBill(int $billId): int;

    public function markPendingXenditFailedForBill(int $billId): int;

    public function findLatestXenditForBill(int $billId, ?string $lookupId = null): ?Payment;

    public function findLatestXenditByIdentifiers(?string $invoiceId, ?string $externalId): ?Payment;

    public function hasForBill(int $billId): bool;
}
