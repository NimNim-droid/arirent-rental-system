<?php

namespace App\Repositories\Eloquent;

use App\Models\MaintenanceTicket;
use App\Repositories\Contracts\MaintenanceRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EloquentMaintenanceRepository implements MaintenanceRepositoryInterface
{
    public function paginate(int $perPage = 50, array $filters = []): LengthAwarePaginator
    {
        $query = MaintenanceTicket::with(['tenant:id,name,room,property_id', 'tenant.property:id,name'])->latest();

        if (! empty($filters['tenant_id'])) {
            $query->where('tenant_id', $filters['tenant_id']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['property_id'])) {
            $query->where('property_id', $filters['property_id']);
        }

        return $query->paginate(min($perPage, 250));
    }

    public function find(int $id, array $relations = []): ?MaintenanceTicket
    {
        $query = MaintenanceTicket::query();
        if (! empty($relations)) {
            $query->with($relations);
        }
        return $query->find($id);
    }

    public function create(array $attributes): MaintenanceTicket
    {
        return MaintenanceTicket::create($attributes);
    }

    public function update(int $id, array $attributes): MaintenanceTicket
    {
        $ticket = MaintenanceTicket::findOrFail($id);
        $ticket->update($attributes);
        return $ticket;
    }

    public function delete(int $id): bool
    {
        $ticket = MaintenanceTicket::find($id);
        return $ticket ? $ticket->delete() : false;
    }
}
