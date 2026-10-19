<?php

namespace App\Repositories\Eloquent;

use App\Models\Property;
use App\Repositories\Contracts\PropertyRepositoryInterface;
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
        ])->get();
    }

    public function find(int $id, array $relations = []): ?Property
    {
        $query = Property::query();
        if (! empty($relations)) {
            $query->with($relations);
        }
        return $query->find($id);
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
}
