<?php

namespace App\Repositories\Contracts;

use App\Models\ListingPhoto;
use Illuminate\Database\Eloquent\Collection;

interface ListingPhotoRepositoryInterface
{
    public function find(int $id): ?ListingPhoto;

    public function create(array $attributes): ListingPhoto;

    public function delete(int $id): bool;

    public function nextSortOrder(int $propertyId, ?int $roomId = null): int;

    public function setCover(ListingPhoto $photo): void;

    public function getByProperty(int $propertyId): Collection;
}
