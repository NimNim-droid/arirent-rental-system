<?php

namespace App\Repositories\Eloquent;

use App\Models\MaintenanceTicket;
use App\Repositories\Contracts\MaintenanceRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class EloquentMaintenanceRepository implements MaintenanceRepositoryInterface
{
    public function paginate(int $perPage = 50, array $filters = []): LengthAwarePaginator
    {
        $query = MaintenanceTicket::with(['tenant:id,name,room,property_id', 'tenant.property:id,name'])->latest();

        $this->applyFilters($query, $filters);

        return $query->paginate(min($perPage, 250));
    }

    /**
     * Ticket counts grouped by status, respecting the given filters
     * (except the status filter itself, which is ignored here).
     *
     * @return array<string, int>
     */
    public function countByStatus(array $filters = []): array
    {
        unset($filters['status']);

        $query = MaintenanceTicket::query();
        $this->applyFilters($query, $filters);

        $counts = $query
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $result = [];
        foreach (['pending', 'in_progress', 'resolved', 'archived'] as $status) {
            $result[$status] = (int) ($counts[$status] ?? 0);
        }

        return $result;
    }

    /**
     * Apply shared list filters to a maintenance tickets query.
     */
    private function applyFilters(Builder $query, array $filters): void
    {
        if (! empty($filters['tenant_id'])) {
            $query->where('tenant_id', $filters['tenant_id']);
        }

        if (! empty($filters['status'])) {
            if ($filters['status'] === 'active') {
                // 'active' = every status except archived.
                $query->whereIn('status', ['pending', 'in_progress', 'resolved']);
            } else {
                $query->where('status', $filters['status']);
            }
        }

        if (! empty($filters['property_id'])) {
            $query->where('property_id', $filters['property_id']);
        }

        if (! empty($filters['search'])) {
            $search = $filters['search'];

            $query->where(function (Builder $q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('room', 'like', "%{$search}%")
                    ->orWhereHas('tenant', function (Builder $tq) use ($search) {
                        $tq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }
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
