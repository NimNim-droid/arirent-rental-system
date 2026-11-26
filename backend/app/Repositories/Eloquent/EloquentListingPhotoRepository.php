<?php

namespace App\Repositories\Eloquent;

use App\Models\ListingPhoto;
use App\Repositories\Contracts\ListingPhotoRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class EloquentListingPhotoRepository implements ListingPhotoRepositoryInterface
{
    public function find(int $id): ?ListingPhoto
    {
        return ListingPhoto::find($id);
    }

    public function create(array $attributes): ListingPhoto
    {
        return ListingPhoto::create($attributes);
    }

    public function delete(int $id): bool
    {
        $photo = ListingPhoto::find($id);

        return $photo ? (bool) $photo->delete() : false;
    }

    public function nextSortOrder(int $propertyId, ?int $roomId = null): int
    {
        $max = ListingPhoto::where('property_id', $propertyId)
            ->when(
                $roomId !== null,
                fn ($q) => $q->where('room_id', $roomId),
                fn ($q) => $q->whereNull('room_id')
            )
            ->max('sort_order');

        return $max === null ? 0 : ((int) $max + 1);
    }

    public function setCover(ListingPhoto $photo): void
    {
        $siblings = ListingPhoto::where('property_id', $photo->property_id)
            ->when(
                $photo->room_id !== null,
                fn ($q) => $q->where('room_id', $photo->room_id),
                fn ($q) => $q->whereNull('room_id')
            )
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        $photo->update(['sort_order' => 0]);

        $order = 1;
        foreach ($siblings as $sibling) {
            if ((int) $sibling->id === (int) $photo->id) {
                continue;
            }
            $sibling->update(['sort_order' => $order++]);
        }
    }

    public function getByProperty(int $propertyId): Collection
    {
        return ListingPhoto::where('property_id', $propertyId)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();
    }
}
