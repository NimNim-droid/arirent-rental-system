<?php

namespace App\Services;

use App\Models\Tenant;
use App\Repositories\Contracts\ReadingRepositoryInterface;
use App\Repositories\Contracts\RoomRepositoryInterface;
use App\Repositories\Contracts\TenantRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class TenantService
{
    public function __construct(
        protected TenantRepositoryInterface $tenantRepo,
        protected RoomRepositoryInterface $roomRepo,
        protected ReadingRepositoryInterface $readingRepo
    ) {}

    /**
     * List tenants with pagination, filters, and computed room rent / latest reading.
     */
    public function listTenants(array $filters = [], int $perPage = 50): LengthAwarePaginator
    {
        $paginated = $this->tenantRepo->paginate($perPage, $filters);

        $propertyIds = $paginated->getCollection()->pluck('property_id')->unique()->all();
        $tenantIds = $paginated->getCollection()->pluck('id')->all();

        $rooms = $this->roomRepo->getRoomsByPropertyIds($propertyIds);
        $latestReadings = $this->readingRepo->getLatestReadingsForTenants($tenantIds);

        $paginated->getCollection()->transform(function ($t) use ($rooms, $latestReadings) {
            $t->room_rent = (float) ($rooms->get("{$t->property_id}-{$t->room}")?->rent ?? 0.00);
            $latestReading = $latestReadings->get($t->id);
            $t->latest_reading = (float) ($latestReading?->curr_reading ?? 0.00);
            return $t;
        });

        return $paginated;
    }

    /**
     * Get a single tenant with relations and computed attributes.
     */
    public function getTenantDetails(int $id): ?Tenant
    {
        $tenant = $this->tenantRepo->find($id, [
            'property',
            'bills' => fn ($q) => $q->latest()->take(5),
            'maintenanceTickets' => fn ($q) => $q->latest()->take(5),
        ]);

        if (! $tenant) {
            return null;
        }

        $room = $this->roomRepo->findByPropertyAndNumber($tenant->property_id, $tenant->room);
        $latestReading = $this->readingRepo->getLatestReadingForTenant($tenant->id);

        $tenant->room_rent = $room ? (float) $room->rent : 0.00;
        $tenant->latest_reading = $latestReading ? (float) $latestReading->curr_reading : 0.00;

        return $tenant;
    }

    /**
     * Update tenant details.
     */
    public function updateTenant(int $id, array $attributes): Tenant
    {
        $tenant = $this->tenantRepo->update($id, $attributes);

        Cache::forget('admin_stats_all');
        Cache::forget("tenant_dashboard_{$id}");

        return $tenant;
    }

    /**
     * Approve a pending tenant application and mark room occupied.
     *
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException
     * @throws \RuntimeException
     */
    public function approveTenant(int $id, ?string $moveInDate = null, ?float $advancePaid = null): Tenant
    {
        $tenant = $this->tenantRepo->find($id);
        if (! $tenant) {
            throw new \Illuminate\Database\Eloquent\ModelNotFoundException('Tenant not found.');
        }

        $room = $this->roomRepo->findByPropertyAndNumber($tenant->property_id, $tenant->room);
        if (! $room) {
            throw new \RuntimeException("Room {$tenant->room} not found in the assigned property.");
        }

        if ($room->status === 'occupied') {
            $otherTenant = $this->tenantRepo->findActiveInRoom($tenant->property_id, $tenant->room, $tenant->id);

            if ($otherTenant) {
                throw new \RuntimeException("Room {$tenant->room} is already occupied by {$otherTenant->name}.");
            }
        }

        return DB::transaction(function () use ($tenant, $room, $moveInDate, $advancePaid) {
            $moveIn = $moveInDate ?? ($tenant->move_in_date ? $tenant->move_in_date->format('Y-m-d') : now()->format('Y-m-d'));
            $advance = $advancePaid ?? (float) ($tenant->advance_paid ?? 0.00);

            $updatedTenant = $this->tenantRepo->update($tenant->id, [
                'status' => 'active',
                'move_in_date' => $moveIn,
                'advance_paid' => $advance,
                'lease_end' => $tenant->lease_end ?? now()->addYear()->format('Y-m-d'),
            ]);

            $this->roomRepo->update($room->id, ['status' => 'occupied']);

            Cache::forget('all_properties_with_counts');
            Cache::forget('admin_stats_all');
            Cache::forget("tenant_dashboard_{$tenant->id}");

            return $updatedTenant;
        });
    }

    /**
     * Reject a pending tenant application and release reserved room.
     */
    public function rejectTenant(int $id): Tenant
    {
        $tenant = $this->tenantRepo->find($id);
        if (! $tenant) {
            throw new \Illuminate\Database\Eloquent\ModelNotFoundException('Tenant not found.');
        }

        return DB::transaction(function () use ($tenant) {
            $updatedTenant = $this->tenantRepo->update($tenant->id, ['status' => 'inactive']);

            $room = $this->roomRepo->findByPropertyAndNumber($tenant->property_id, $tenant->room);
            if ($room && $room->status === 'reserved') {
                $this->roomRepo->update($room->id, ['status' => 'vacant']);
            }

            Cache::forget('all_properties_with_counts');
            Cache::forget('admin_stats_all');
            Cache::forget("tenant_dashboard_{$tenant->id}");

            return $updatedTenant;
        });
    }

    /**
     * Mark a tenant as vacated and release the room.
     *
     * @throws \InvalidArgumentException
     */
    public function vacateTenant(int $id): Tenant
    {
        $tenant = $this->tenantRepo->find($id);
        if (! $tenant) {
            throw new \Illuminate\Database\Eloquent\ModelNotFoundException('Tenant not found.');
        }

        if ($tenant->status !== 'active') {
            throw new \InvalidArgumentException('Only active tenants can be vacated.');
        }

        return DB::transaction(function () use ($tenant) {
            $updatedTenant = $this->tenantRepo->update($tenant->id, [
                'status' => 'inactive',
                'vacated_date' => now(),
            ]);

            $room = $this->roomRepo->findByPropertyAndNumber($tenant->property_id, $tenant->room);
            if ($room) {
                $this->roomRepo->update($room->id, ['status' => 'vacant']);
            }

            Cache::forget('all_properties_with_counts');
            Cache::forget('admin_stats_all');
            Cache::forget("tenant_dashboard_{$tenant->id}");

            return $updatedTenant;
        });
    }

    /**
     * Delete a tenant record, release room, and clean up linked user.
     */
    public function deleteTenant(int $id): bool
    {
        $tenant = $this->tenantRepo->find($id);
        if (! $tenant) {
            throw new \Illuminate\Database\Eloquent\ModelNotFoundException('Tenant not found.');
        }

        if ($tenant->bills()->exists()
            || $tenant->payments()->exists()
            || $tenant->excessCharges()->exists()
            || $tenant->utilityReadings()->exists()
            || $tenant->maintenanceTickets()->exists()) {
            throw new \InvalidArgumentException('This tenant has billing or service history and cannot be deleted. Vacate the tenant instead.');
        }

        return DB::transaction(function () use ($tenant) {
            $room = $this->roomRepo->findByPropertyAndNumber($tenant->property_id, $tenant->room);
            if ($room && in_array($room->status, ['reserved', 'occupied'])) {
                $this->roomRepo->update($room->id, ['status' => 'vacant']);
            }

            if ($tenant->user_id) {
                $this->tenantRepo->deleteUser($tenant->user_id);
            }

            $deleted = $this->tenantRepo->delete($tenant->id);

            Cache::forget('all_properties_with_counts');
            Cache::forget('admin_stats_all');
            Cache::forget("tenant_dashboard_{$tenant->id}");

            return $deleted;
        });
    }
}
