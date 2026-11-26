<?php

namespace App\Repositories\Eloquent;

use App\Models\Room;
use App\Repositories\Contracts\RoomRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Collection as BaseCollection;

class EloquentRoomRepository implements RoomRepositoryInterface
{
    public function get(array $filters = []): Collection
    {
        $query = Room::with([
            'property:id,name,city,address',
            'photos',
        ]);

        if (! empty($filters['property_id'])) {
            $query->where('property_id', $filters['property_id']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (array_key_exists('is_listed', $filters) && $filters['is_listed'] !== null) {
            $query->where('is_listed', (bool) $filters['is_listed']);
        }

        return $query->orderBy('property_id')->orderBy('room_number')->get();
    }

    public function find(int $id, array $relations = []): ?Room
    {
        $query = Room::query();
        if (! empty($relations)) {
            $query->with($relations);
        }

        return $query->find($id);
    }

    public function findForUpdate(int $id): ?Room
    {
        return Room::where('id', $id)->lockForUpdate()->first();
    }

    public function findPublicRoom(int $id): ?Room
    {
        return Room::query()
            ->where('is_listed', true)
            ->with([
                'photos',
                'property.photos',
                'property.rooms' => fn ($q) => $q->where('is_listed', true)->where('status', 'vacant')->orderBy('rent'),
                'property.rooms.photos',
            ])
            ->find($id);
    }

    public function findByPropertyAndNumber(int $propertyId, string $roomNumber): ?Room
    {
        return Room::where('property_id', $propertyId)
            ->where('room_number', $roomNumber)
            ->first();
    }

    public function findByPropertyAndNumberForUpdate(int $propertyId, string $roomNumber): ?Room
    {
        return Room::where('property_id', $propertyId)
            ->where('room_number', $roomNumber)
            ->lockForUpdate()
            ->first();
    }

    public function create(array $attributes): Room
    {
        return Room::create($attributes);
    }

    public function update(int $id, array $attributes): Room
    {
        $room = Room::findOrFail($id);
        $room->update($attributes);

        return $room->load('photos');
    }

    public function delete(int $id): bool
    {
        $room = Room::find($id);

        return $room ? (bool) $room->delete() : false;
    }

    public function getRoomsByPropertyIds(array $propertyIds): BaseCollection
    {
        return Room::whereIn('property_id', $propertyIds)
            ->get(['property_id', 'room_number', 'rent'])
            ->keyBy(fn ($r) => "{$r->property_id}-{$r->room_number}");
    }

    public function getOccupancyStats(?int $propertyId = null): array
    {
        $query = Room::query();
        if ($propertyId) {
            $query->where('property_id', $propertyId);
        }

        $stats = $query
            ->selectRaw("count(*) as total, count(case when status = 'occupied' then 1 end) as occupied, count(case when status = 'vacant' then 1 end) as vacant, count(case when status = 'reserved' then 1 end) as reserved")
            ->first();

        return [
            'total' => (int) ($stats->total ?? 0),
            'occupied' => (int) ($stats->occupied ?? 0),
            'vacant' => (int) ($stats->vacant ?? 0),
            'reserved' => (int) ($stats->reserved ?? 0),
        ];
    }

    public function deleteByPropertyId(int $propertyId): int
    {
        return Room::where('property_id', $propertyId)->delete();
    }
}
