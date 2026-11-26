<?php

namespace App\Repositories\Eloquent;

use App\Models\Property;
use App\Repositories\Contracts\PropertyRepositoryInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class EloquentPropertyRepository implements PropertyRepositoryInterface
{
    public function allWithCounts(): Collection
    {
        return Property::withCount([
            'rooms',
            'rooms as occupied_count' => function ($query) {
                $query->where('status', 'occupied');
            },
            'rooms as listed_rooms_count' => function ($query) {
                $query->where('is_listed', true);
            },
            'rooms as available_rooms_count' => function ($query) {
                $query->where('is_listed', true)->where('status', 'vacant');
            },
        ])->with('photos')->get();
    }

    public function find(int $id, array $relations = []): ?Property
    {
        $query = Property::query();
        if (! empty($relations)) {
            $query->with($relations);
        }
        return $query->find($id);
    }

    public function findWithOccupiedCount(int $id): ?Property
    {
        return Property::withCount([
            'rooms as occupied_rooms' => function ($q) {
                $q->where('status', 'occupied');
            },
        ])->find($id);
    }

    public function create(array $attributes): Property
    {
        return Property::create($attributes);
    }

    public function update(int $id, array $attributes): Property
    {
        $property = Property::findOrFail($id);
        $property->update($attributes);
        return $property;
    }

    public function delete(int $id): bool
    {
        $property = Property::find($id);
        return $property ? $property->delete() : false;
    }

    public function getPublicListings(array $filters = []): Collection
    {
        $availableRooms = function (Builder $q) use ($filters) {
            $q->where('is_listed', true)->where('status', 'vacant');

            if (isset($filters['min_rent'])) {
                $q->where('rent', '>=', (float) $filters['min_rent']);
            }
            if (isset($filters['max_rent'])) {
                $q->where('rent', '<=', (float) $filters['max_rent']);
            }
            if (isset($filters['capacity'])) {
                $q->where('capacity', '>=', (int) $filters['capacity']);
            }
        };

        $hasRoomFilters = isset($filters['min_rent']) || isset($filters['max_rent']) || isset($filters['capacity']);

        return Property::query()
            ->whereHas('rooms', fn (Builder $q) => $q->where('is_listed', true))
            ->when($hasRoomFilters, fn (Builder $q) => $q->whereHas('rooms', $availableRooms))
            ->when(! empty($filters['city']), fn (Builder $q) => $q->where('city', $filters['city']))
            ->when(! empty($filters['q']), function (Builder $q) use ($filters) {
                $term = '%' . mb_strtolower(trim((string) $filters['q'])) . '%';
                $q->where(function (Builder $inner) use ($term) {
                    $inner->whereRaw('LOWER(name) LIKE ?', [$term])
                        ->orWhereRaw('LOWER(city) LIKE ?', [$term])
                        ->orWhereRaw('LOWER(address) LIKE ?', [$term]);
                });
            })
            ->withCount([
                'rooms as listed_rooms_count' => fn (Builder $q) => $q->where('is_listed', true),
                'rooms as available_rooms_count' => $availableRooms,
            ])
            ->withMin(['rooms as starting_rent' => $availableRooms], 'rent')
            ->with([
                'photos',
                'rooms' => fn ($q) => $q->where('is_listed', true)->orderBy('rent'),
                'rooms.photos',
            ])
            ->orderByDesc('available_rooms_count')
            ->orderBy('name')
            ->get();
    }

    public function findPublicListing(int $id): ?Property
    {
        return Property::query()
            ->whereHas('rooms', fn (Builder $q) => $q->where('is_listed', true))
            ->with([
                'photos',
                'rooms' => fn ($q) => $q->where('is_listed', true)->orderBy('rent')->orderBy('room_number'),
                'rooms.photos',
            ])
            ->find($id);
    }
}
