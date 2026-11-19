<?php

namespace App\Services;

use App\Models\Property;
use App\Models\Room;
use App\Repositories\Contracts\PropertyRepositoryInterface;
use App\Repositories\Contracts\RoomRepositoryInterface;
use App\Repositories\Contracts\TenantRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class PropertyService
{
    public function __construct(
        protected PropertyRepositoryInterface $propertyRepo,
        protected RoomRepositoryInterface $roomRepo,
        protected TenantRepositoryInterface $tenantRepo
    ) {}

    /**
     * Get all properties with room counts and occupied counts (cached).
     */
    public function getAllPropertiesWithCounts(): Collection
    {
        return Cache::remember('all_properties_with_counts', 60, function () {
            return $this->propertyRepo->allWithCounts();
        });
    }

    /**
     * Get property by ID with rooms.
     */
    public function getProperty(int $id): ?Property
    {
        return $this->propertyRepo->find($id, ['rooms']);
    }

    /**
     * Create a new property.
     */
    public function createProperty(array $attributes): Property
    {
        $property = $this->propertyRepo->create($attributes);

        Cache::forget('all_properties_with_counts');
        Cache::forget('admin_stats_all');

        return $property;
    }

    /**
     * Update an existing property.
     */
    public function updateProperty(int $id, array $attributes): Property
    {
        $property = $this->propertyRepo->update($id, $attributes);

        $this->forgetPropertyCaches($id);

        return $property;
    }

    /**
     * Delete property if there are no occupied rooms.
     *
     * @throws \RuntimeException
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException
     */
    public function deleteProperty(int $id): bool
    {
        $property = $this->propertyRepo->findWithOccupiedCount($id);

        if (! $property) {
            throw new \Illuminate\Database\Eloquent\ModelNotFoundException('Property not found.');
        }

        if ($property->occupied_rooms > 0) {
            throw new \RuntimeException('Cannot delete property with occupied rooms. Please vacate or reassign tenants first.');
        }

        $this->roomRepo->deleteByPropertyId($id);
        $deleted = $this->propertyRepo->delete($id);

        $this->forgetPropertyCaches($id);

        return $deleted;
    }

    /**
     * Get rooms with optional filters.
     */
    public function getRooms(array $filters = []): Collection
    {
        return $this->roomRepo->get($filters);
    }

    /**
     * Create a new room.
     *
     * @throws \RuntimeException
     */
    public function createRoom(array $attributes): Room
    {
        if (($attributes['status'] ?? 'vacant') === 'occupied') {
            throw new \RuntimeException('A new room cannot be marked Occupied until an active tenant is assigned to it.');
        }

        $room = $this->roomRepo->create($attributes);

        $this->forgetPropertyCaches((int) $room->property_id);

        return $room;
    }

    /**
     * Update room details while keeping room status synchronized with assigned tenants.
     *
     * @throws ModelNotFoundException
     * @throws \RuntimeException
     */
    public function updateRoom(int $id, array $attributes): Room
    {
        $existing = $this->roomRepo->find($id);
        if (! $existing) {
            throw new ModelNotFoundException('Room not found.');
        }

        $nextStatus = $attributes['status'] ?? $existing->status;
        if ($nextStatus !== $existing->status) {
            $activeTenant = $this->tenantRepo->findActiveInRoom((int) $existing->property_id, (string) $existing->room_number);

            if ($nextStatus === 'occupied' && ! $activeTenant) {
                throw new \RuntimeException('A room can only be marked Occupied when an active tenant is assigned to it.');
            }

            if ($nextStatus === 'vacant' && $activeTenant) {
                throw new \RuntimeException("Room {$existing->room_number} is currently occupied by {$activeTenant->name}. Vacate or reassign the tenant first.");
            }
        }

        $newRoomNumber = isset($attributes['room_number']) ? trim((string) $attributes['room_number']) : null;
        $roomRenamed = $newRoomNumber !== null && $newRoomNumber !== '' && $newRoomNumber !== (string) $existing->room_number;

        return DB::transaction(function () use ($id, $attributes, $existing, $roomRenamed, $newRoomNumber) {
            $room = $this->roomRepo->update($id, $attributes);

            if ($roomRenamed) {
                $occupant = $this->tenantRepo->findOccupyingInRoom((int) $existing->property_id, (string) $existing->room_number);
                if ($occupant) {
                    $this->tenantRepo->update($occupant->id, ['room' => $newRoomNumber]);
                    Cache::forget("tenant_dashboard_{$occupant->id}");
                }
            }

            $this->forgetPropertyCaches((int) $room->property_id);

            return $room;
        });
    }

    /**
     * Delete room if not occupied.
     *
     * @throws \RuntimeException
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException
     */
    public function deleteRoom(int $id): bool
    {
        $room = $this->roomRepo->find($id);
        if (! $room) {
            throw new \Illuminate\Database\Eloquent\ModelNotFoundException('Room not found.');
        }

        if ($room->status === 'occupied') {
            throw new \RuntimeException('Cannot delete an occupied room. Please vacate the tenant first.');
        }

        $propertyId = (int) $room->property_id;
        $deleted = $this->roomRepo->delete($id);

        $this->forgetPropertyCaches($propertyId);

        return $deleted;
    }

    protected function forgetPropertyCaches(int $propertyId): void
    {
        Cache::forget('all_properties_with_counts');
        Cache::forget('admin_stats_all');
        Cache::forget("admin_stats_{$propertyId}");
    }
}
