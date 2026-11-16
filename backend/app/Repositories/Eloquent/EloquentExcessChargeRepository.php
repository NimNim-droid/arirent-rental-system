<?php

namespace App\Repositories\Eloquent;

use App\Models\ExcessCharge;
use App\Repositories\Contracts\ExcessChargeRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class EloquentExcessChargeRepository implements ExcessChargeRepositoryInterface
{
    public function listWithRelations(array $filters = []): Collection
    {
        $query = ExcessCharge::with(['tenant:id,name,room', 'bill:id,date,status'])
            ->latest('charge_date');

        if (! empty($filters['tenant_id'])) {
            $query->where('tenant_id', $filters['tenant_id']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->get();
    }

    public function find(int $id): ?ExcessCharge
    {
        return ExcessCharge::find($id);
    }

    public function create(array $attributes): ExcessCharge
    {
        return ExcessCharge::create($attributes);
    }

    public function delete(int $id): bool
    {
        $charge = ExcessCharge::find($id);

        return $charge ? (bool) $charge->delete() : false;
    }

    public function findPendingByIdsForTenant(array $ids, int $tenantId): Collection
    {
        return ExcessCharge::whereIn('id', $ids)
            ->where('tenant_id', $tenantId)
            ->where('status', 'pending')
            ->get();
    }

    public function getPendingForTenant(int $tenantId): Collection
    {
        return ExcessCharge::where('tenant_id', $tenantId)
            ->where('status', 'pending')
            ->get();
    }

    public function attachToBill(array $ids, int $billId): int
    {
        return ExcessCharge::whereIn('id', $ids)->update([
            'bill_id' => $billId,
            'status' => 'billed',
        ]);
    }

    public function releaseByBillId(int $billId): int
    {
        return ExcessCharge::where('bill_id', $billId)->update([
            'bill_id' => null,
            'status' => 'pending',
        ]);
    }

    public function sumForBill(int $billId): float
    {
        return (float) ExcessCharge::where('bill_id', $billId)->sum('amount');
    }
}

