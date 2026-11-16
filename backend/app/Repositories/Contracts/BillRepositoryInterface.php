<?php

namespace App\Repositories\Contracts;

use App\Models\Bill;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface BillRepositoryInterface
{
    public function paginate(int $perPage = 50, array $filters = []): LengthAwarePaginator;

    public function find(int $id, array $relations = []): ?Bill;

    /**
     * Find a bill inside a transaction with a row lock.
     */
    public function findForUpdate(int $id): ?Bill;

    public function create(array $attributes): Bill;

    public function update(int $id, array $attributes): Bill;

    public function delete(int $id): bool;

    public function insertBatch(array $records): bool;

    public function getBilledTenantIdsForMonth(array $tenantIds, string $monthStart, string $monthEnd): array;

    public function getOverdueTenantIds(string $today): array;

    public function getOverdueBillsWithTenant(string $today): Collection;

    public function findForTenantInMonth(int $tenantId, string $monthStart, string $monthEnd, ?string $status = null): ?Bill;

    public function sumPaidRevenue(?int $propertyId = null): float;

    public function countPendingVerification(?int $propertyId = null): int;

    public function findEarliestOwedForTenant(int $tenantId): ?Bill;

    public function getLatestNonVoidedRentForTenant(int $tenantId): float;
}
