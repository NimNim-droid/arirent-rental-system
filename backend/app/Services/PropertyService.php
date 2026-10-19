<?php

namespace App\Services;

use App\Models\Property;
use App\Models\Room;
use App\Repositories\Contracts\PropertyRepositoryInterface;
use App\Repositories\Contracts\RoomRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;

class PropertyService
{
    public function __construct(
        protected PropertyRepositoryInterface $propertyRepo,
        protected RoomRepositoryInterface $roomRepo
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

        Cache::forget('all_properties_with_counts');
        Cache::forget('admin_stats_all');

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

        $property->rooms()->delete();
        $deleted = $this->propertyRepo->delete($id);

        Cache::forget('all_properties_with_counts');
        Cache::forget('admin_stats_all');

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
     */
    public function createRoom(array $attributes): Room
    {
        $room = $this->roomRepo->create($attributes);

        Cache::forget('all_properties_with_counts');
        Cache::forget('admin_stats_all');

        return $room;
    }

    /**
     * Update room details.
     */
    public function updateRoom(int $id, array $attributes): Room
    {
        $room = $this->roomRepo->update($id, $attributes);

        Cache::forget('all_properties_with_counts');
        Cache::forget('admin_stats_all');

        return $room;
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

        $deleted = $this->roomRepo->delete($id);

        Cache::forget('all_properties_with_counts');
        Cache::forget('admin_stats_all');

        return $deleted;
    }
}
