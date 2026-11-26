<?php

namespace App\Services;

use App\Exceptions\DomainException;
use App\Models\ListingPhoto;
use App\Models\Property;
use App\Models\Room;
use App\Repositories\Contracts\ListingPhotoRepositoryInterface;
use App\Repositories\Contracts\PropertyRepositoryInterface;
use App\Repositories\Contracts\RoomRepositoryInterface;
use App\Support\PublicFile;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class ListingService
{
    public function __construct(
        protected PropertyRepositoryInterface $propertyRepo,
        protected RoomRepositoryInterface $roomRepo,
        protected ListingPhotoRepositoryInterface $photoRepo
    ) {}

    /**
     * Public property catalog with available units and distinct city facets.
     *
     * @return array{listings: \Illuminate\Database\Eloquent\Collection, cities: array<int, string>}
     */
    public function getPublicListings(array $filters = []): array
    {
        $listings = $this->propertyRepo->getPublicListings($filters);

        $allListed = empty($filters)
            ? $listings
            : $this->propertyRepo->getPublicListings([]);

        $cities = $allListed
            ->pluck('city')
            ->filter()
            ->unique()
            ->sort()
            ->values()
            ->all();

        return [
            'listings' => $listings,
            'cities' => $cities,
        ];
    }

    /**
     * Public building detail page with published units and photos.
     *
     * @throws ModelNotFoundException
     */
    public function getPublicProperty(int $id): Property
    {
        $property = $this->propertyRepo->findPublicListing($id);

        if (! $property) {
            throw new ModelNotFoundException('Listing not found.');
        }

        return $property;
    }

    /**
     * Public unit detail page with gallery, amenities, move-in cost, and contact info.
     *
     * @throws ModelNotFoundException
     */
    public function getPublicRoom(int $id): Room
    {
        $room = $this->roomRepo->findPublicRoom($id);

        if (! $room) {
            throw new ModelNotFoundException('Room listing not found.');
        }

        return $room;
    }

    /**
     * Admin view of a building's listing profile, photos, and all rooms with their photos.
     *
     * @throws ModelNotFoundException
     */
    public function getAdminPropertyListing(int $propertyId): Property
    {
        $property = $this->propertyRepo->find($propertyId, [
            'photos',
            'rooms' => fn ($q) => $q->orderBy('room_number'),
            'rooms.photos',
        ]);

        if (! $property) {
            throw new ModelNotFoundException('Property not found.');
        }

        return $property;
    }

    /**
     * Upload one or more photos for a building or specific room.
     *
     * @param  array<int, UploadedFile>  $files
     *
     * @throws ModelNotFoundException
     * @throws DomainException
     */
    public function uploadPhotos(int $propertyId, array $files, ?int $roomId = null): Collection
    {
        $property = $this->propertyRepo->find($propertyId);
        if (! $property) {
            throw new ModelNotFoundException('Property not found.');
        }

        if ($roomId !== null) {
            $room = $this->roomRepo->find($roomId);
            if (! $room || (int) $room->property_id !== (int) $property->id) {
                throw new DomainException('Selected room does not belong to this property.', 422);
            }
        }

        $storedPaths = [];

        try {
            $created = DB::transaction(function () use ($property, $roomId, $files, &$storedPaths) {
                $nextOrder = $this->photoRepo->nextSortOrder((int) $property->id, $roomId);
                $directory = $roomId !== null
                    ? "listing_photos/properties/{$property->id}/rooms/{$roomId}"
                    : "listing_photos/properties/{$property->id}";

                $records = collect();
                foreach ($files as $file) {
                    $path = PublicFile::store($file, $directory);
                    $storedPaths[] = $path;

                    $records->push($this->photoRepo->create([
                        'property_id' => $property->id,
                        'room_id' => $roomId,
                        'path' => $path,
                        'sort_order' => $nextOrder++,
                    ]));
                }

                return $records;
            });

            Cache::forget('all_properties_with_counts');

            return $created;
        } catch (\Throwable $e) {
            foreach ($storedPaths as $path) {
                PublicFile::delete($path);
            }
            throw $e;
        }
    }

    /**
     * Promote a photo to cover image (sort_order = 0) within its building or room gallery.
     *
     * @throws ModelNotFoundException
     */
    public function setCoverPhoto(int $photoId): ListingPhoto
    {
        $photo = $this->photoRepo->find($photoId);
        if (! $photo) {
            throw new ModelNotFoundException('Photo not found.');
        }

        DB::transaction(function () use ($photo) {
            $this->photoRepo->setCover($photo);
        });

        Cache::forget('all_properties_with_counts');

        return $this->photoRepo->find($photoId) ?? $photo;
    }

    /**
     * Delete a listing photo and its underlying stored file.
     *
     * @throws ModelNotFoundException
     */
    public function deletePhoto(int $photoId): void
    {
        $photo = $this->photoRepo->find($photoId);
        if (! $photo) {
            throw new ModelNotFoundException('Photo not found.');
        }

        $path = $photo->path;
        $this->photoRepo->delete($photoId);
        PublicFile::delete($path);

        Cache::forget('all_properties_with_counts');
    }
}
