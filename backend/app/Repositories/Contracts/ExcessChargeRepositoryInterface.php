<?php

namespace App\Repositories\Contracts;

use App\Models\ExcessCharge;
use Illuminate\Database\Eloquent\Collection;

interface ExcessChargeRepositoryInterface
{
    public function listWithRelations(array $filters = []): Collection;

    public function find(int $id): ?ExcessCharge;

    public function create(array $attributes): ExcessCharge;

    public function delete(int $id): bool;

    public function findPendingByIdsForTenant(array $ids, int $tenantId): Collection;

    public function getPendingForTenant(int $tenantId): Collection;

    public function attachToBill(array $ids, int $billId): int;

    public function releaseByBillId(int $billId): int;

    public function sumForBill(int $billId): float;
}

