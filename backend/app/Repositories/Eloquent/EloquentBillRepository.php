<?php

namespace App\Repositories\Eloquent;

use App\Models\Bill;
use App\Repositories\Contracts\BillRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EloquentBillRepository implements BillRepositoryInterface
{
    public function paginate(int $perPage = 50, array $filters = []): LengthAwarePaginator
    {
        $query = Bill::with(['tenant:id,name,room,property_id', 'tenant.property:id,name'])->latest('date');

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
        }
        return $query->find($id);
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
        return Bill::where('status', 'unpaid')
            ->where('due_date', '<', $today)
            ->pluck('tenant_id')
            ->unique()
            ->flip()
            ->all();
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
}
