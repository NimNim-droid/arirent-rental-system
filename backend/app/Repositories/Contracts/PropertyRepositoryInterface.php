<?php

namespace App\Repositories\Contracts;

use App\Models\Property;
use Illuminate\Database\Eloquent\Collection;

interface PropertyRepositoryInterface
{
    public function allWithCounts(): Collection;

    public function find(int $id, array $relations = []): ?Property;

    public function findWithOccupiedCount(int $id): ?Property;

    public function create(array $attributes): Property;

    public function update(int $id, array $attributes): Property;

    public function delete(int $id): bool;

    /**
     * Properties that have at least one published room, with the number of
     * available rooms and the lowest available rent matching the filters.
     *
     * @param  array{q?: string, city?: string, min_rent?: float, max_rent?: float, capacity?: int}  $filters
     */
    public function getPublicListings(array $filters = []): Collection;

    /**
     * A single property as shown to the public: building photos plus its
     * published rooms (any status) with their photos.
     */
    public function findPublicListing(int $id): ?Property;
}
