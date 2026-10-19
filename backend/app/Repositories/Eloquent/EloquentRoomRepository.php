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
        $query = Room::with('property:id,name,city,address');

        if (! empty($filters['property_id'])) {
            $query->where('property_id', $filters['property_id']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->get();
    }

    public function find(int $id, array $relations = []): ?Room
    {
        $query = Room::query();
        if (! empty($relations)) {
            $query->with($relations);
        }
        return $query->find($id);
    }

    public function findByPropertyAndNumber(int $propertyId, string $roomNumber): ?Room
    {
        return Room::where('property_id', $propertyId)
            ->where('room_number', $roomNumber)
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
        return $room;
    }

    public function delete(int $id): bool
    {
        $room = Room::find($id);
        return $room ? $room->delete() : false;
    }

    public function getRoomsByPropertyIds(array $propertyIds): BaseCollection
    {
        return Room::whereIn('property_id', $propertyIds)
            ->get(['property_id', 'room_number', 'rent'])
            ->keyBy(fn ($r) => "{$r->property_id}-{$r->room_number}");
    }
}
