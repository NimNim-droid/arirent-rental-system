<?php

namespace App\Repositories\Eloquent;

use App\Models\Bill;
use App\Repositories\Contracts\BillRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class EloquentBillRepository implements BillRepositoryInterface
{
    public function paginate(int $perPage = 50, array $filters = []): LengthAwarePaginator
    {
        $query = Bill::with([
            'tenant:id,name,room,property_id',
            'tenant.property:id,name',
            'payments',
            'excessCharges',
            'readings',
        ])->latest('date');

        if (! empty($filters['tenant_id'])) {
            $query->where('tenant_id', $filters['tenant_id']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->paginate(min($perPage, 250));
    }

    public function find(int $id, array $relations = []): ?Bill
    {
        $query = Bill::query();
        if (! empty($relations)) {
            $query->with($relations);
        } else {
            $query->with([
                'tenant:id,name,room,property_id',
                'tenant.property:id,name',
                'payments',
                'excessCharges',
                'readings',
            ]);
        }
        return $query->find($id);
    }

    public function findForUpdate(int $id): ?Bill
    {
        return Bill::query()->lockForUpdate()->find($id);
    }

    public function create(array $attributes): Bill
    {
        return Bill::create($attributes);
    }

    public function update(int $id, array $attributes): Bill
    {
        $bill = Bill::findOrFail($id);
        $bill->update($attributes);
        return $bill;
    }

    public function delete(int $id): bool
    {
        $bill = Bill::find($id);
        return $bill ? $bill->delete() : false;
    }

    public function insertBatch(array $records): bool
    {
        return Bill::insert($records);
    }

    public function getBilledTenantIdsForMonth(array $tenantIds, string $monthStart, string $monthEnd): array
    {
        return Bill::whereIn('tenant_id', $tenantIds)
            ->where('status', '!=', 'voided')
            ->whereBetween('date', [$monthStart, $monthEnd])
            ->pluck('tenant_id')
            ->flip()
            ->all();
    }

    public function getOverdueTenantIds(string $today): array
    {
        return Bill::whereIn('status', ['unpaid', 'partially_paid'])
            ->where('due_date', '<', $today)
            ->pluck('tenant_id')
            ->unique()
            ->flip()
            ->all();
    }

    public function getOverdueBillsWithTenant(string $today): Collection
    {
        return Bill::with(['tenant:id,name,room,property_id', 'tenant.property:id,name'])
            ->whereIn('status', ['unpaid', 'partially_paid'])
            ->where('due_date', '<', $today)
            ->get();
    }

    public function findForTenantInMonth(int $tenantId, string $monthStart, string $monthEnd, ?string $status = null): ?Bill
    {
        $query = Bill::where('tenant_id', $tenantId)
            ->whereBetween('date', [$monthStart, $monthEnd]);

        if ($status) {
            $query->where('status', $status);
        }

        return $query->latest('date')->first();
    }

    public function sumPaidRevenue(?int $propertyId = null): float
    {
        $query = Bill::where('status', 'paid');

        if ($propertyId) {
            $query->whereHas('tenant', fn ($q) => $q->where('property_id', $propertyId));
        }

        return (float) $query->sum('total_amount');
    }

    public function countPendingVerification(?int $propertyId = null): int
    {
        $query = Bill::where('status', 'pending_verification');

        if ($propertyId) {
            $query->whereHas('tenant', fn ($q) => $q->where('property_id', $propertyId));
        }

        return $query->count();
    }

    public function findEarliestOwedForTenant(int $tenantId): ?Bill
    {
        return Bill::where('tenant_id', $tenantId)
            ->whereIn('status', ['unpaid', 'partially_paid', 'pending_verification'])
            ->orderBy('due_date', 'asc')
            ->select(['id', 'due_date'])
            ->first();
    }

    public function getLatestNonVoidedRentForTenant(int $tenantId): float
    {
        return (float) Bill::where('tenant_id', $tenantId)
            ->where('status', '!=', 'voided')
            ->latest('date')
            ->value('rent');
    }
}
