<?php

namespace App\Repositories\Eloquent;

use App\Models\Tenant;
use App\Repositories\Contracts\TenantRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class EloquentTenantRepository implements TenantRepositoryInterface
{
    public function paginate(int $perPage = 50, array $filters = []): LengthAwarePaginator
    {
        $query = Tenant::with('property:id,name,address')->latest();

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['property_id'])) {
            $query->where('property_id', $filters['property_id']);
        }

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%")
                    ->orWhere('room', 'like', "%{$search}%");
            });
        }

        return $query->paginate(min($perPage, 250));
    }

    public function find(int $id, array $relations = []): ?Tenant
    {
        $query = Tenant::query();
        if (! empty($relations)) {
            $query->with($relations);
        }
        return $query->find($id);
    }

    public function findByUserIdOrEmail(int $userId, string $email): ?Tenant
    {
        return Tenant::where('user_id', $userId)
            ->orWhere('email', $email)
            ->first();
    }

    public function findActiveInRoom(int $propertyId, string $room, ?int $excludeTenantId = null): ?Tenant
    {
        $query = Tenant::where('property_id', $propertyId)
            ->where('room', $room)
            ->where('status', 'active');

        if ($excludeTenantId) {
            $query->where('id', '!=', $excludeTenantId);
        }

        return $query->first();
    }

    public function findOccupyingInRoom(int $propertyId, string $room, ?int $excludeTenantId = null): ?Tenant
    {
        $query = Tenant::where('property_id', $propertyId)
            ->where('room', $room)
            ->whereIn('status', ['active', 'pending_approval']);

        if ($excludeTenantId) {
            $query->where('id', '!=', $excludeTenantId);
        }

        return $query->orderByRaw("CASE WHEN status = 'active' THEN 0 ELSE 1 END")->first();
    }

    public function incrementBalance(int $tenantId, float $amount): bool
    {
        return (bool) Tenant::where('id', $tenantId)->increment('balance', $amount);
    }

    public function decrementBalance(int $tenantId, float $amount): bool
    {
        $tenant = Tenant::find($tenantId);
        if (! $tenant || $amount <= 0) {
            return false;
        }

        $safeDecrement = min((float) $tenant->balance, $amount);
        if ($safeDecrement <= 0) {
            return true;
        }

        return (bool) $tenant->decrement('balance', $safeDecrement);
    }

    public function existsByUsername(string $username): bool
    {
        return Tenant::where('username', $username)->exists();
    }

    public function countPendingApproval(?int $propertyId = null): int
    {
        $query = Tenant::where('status', 'pending_approval');

        if ($propertyId) {
            $query->where('property_id', $propertyId);
        }

        return $query->count();
    }

    public function hasFinancialOrServiceHistory(int $tenantId): bool
    {
        $tenant = Tenant::find($tenantId);
        if (! $tenant) {
            return false;
        }

        return $tenant->bills()->exists()
            || $tenant->payments()->exists()
            || $tenant->excessCharges()->exists()
            || $tenant->utilityReadings()->exists()
            || $tenant->maintenanceTickets()->exists();
    }

    public function create(array $attributes): Tenant
    {
        return Tenant::create($attributes);
    }

    public function update(int $id, array $attributes): Tenant
    {
        $tenant = Tenant::findOrFail($id);
        $tenant->update($attributes);
        return $tenant;
    }

    public function delete(int $id): bool
    {
        $tenant = Tenant::find($id);
        return $tenant ? $tenant->delete() : false;
    }

    public function getActiveTenants(): Collection
    {
        return Tenant::where('status', 'active')->get();
    }
}
