<?php

namespace App\Repositories\Eloquent;

use App\Models\UtilityReading;
use App\Repositories\Contracts\ReadingRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class EloquentReadingRepository implements ReadingRepositoryInterface
{
    public function paginate(int $perPage = 50, array $filters = []): LengthAwarePaginator
    {
        $query = UtilityReading::with(['tenant:id,name,room,property_id', 'tenant.property:id,name'])->latest('date');

        if (! empty($filters['tenant_id'])) {
            $query->where('tenant_id', $filters['tenant_id']);
        }

        if (! empty($filters['property_id'])) {
            $propertyId = $filters['property_id'];
            $query->whereHas('tenant', fn ($q) => $q->where('property_id', $propertyId));
        }

        if (! empty($filters['month'])) {
            $monthStart = Carbon::parse($filters['month'])->startOfMonth()->format('Y-m-d');
            $monthEnd = Carbon::parse($filters['month'])->endOfMonth()->format('Y-m-d');
            $query->whereBetween('date', [$monthStart, $monthEnd]);
        }

        return $query->paginate(min($perPage, 250));
    }

    public function find(int $id, array $relations = []): ?UtilityReading
    {
        $query = UtilityReading::query();
        if (! empty($relations)) {
            $query->with($relations);
        }
        return $query->find($id);
    }

    public function create(array $attributes): UtilityReading
    {
        return UtilityReading::create($attributes);
    }

    public function update(int $id, array $attributes): UtilityReading
    {
        $reading = UtilityReading::findOrFail($id);
        $reading->update($attributes);
        return $reading;
    }

    public function delete(int $id): bool
    {
        $reading = UtilityReading::find($id);
        return $reading ? $reading->delete() : false;
    }

    public function getLatestReadingForTenant(int $tenantId): ?UtilityReading
    {
        return UtilityReading::where('tenant_id', $tenantId)->latest('date')->first();
    }

    public function getLatestReadingsForTenants(array $tenantIds, bool $unbilledOnly = true): Collection
    {
        $query = UtilityReading::whereIn('tenant_id', $tenantIds);

        if ($unbilledOnly) {
            $query->whereNull('bill_id');
        }

        return $query->orderBy('date', 'desc')
            ->get(['id', 'tenant_id', 'bill_id', 'curr_reading', 'amount', 'usage_kwh', 'date'])
            ->groupBy('tenant_id')
            ->map(fn ($g) => $g->first());
    }
}
