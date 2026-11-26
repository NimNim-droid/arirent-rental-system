<?php

namespace App\Http\Controllers;

use App\Exceptions\DomainException;
use App\Http\Requests\Listing\UploadListingPhotosRequest;
use App\Http\Resources\ListingPhotoResource;
use App\Services\ListingService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;

class ListingPhotoController extends Controller
{
    public function __construct(
        protected ListingService $listingService
    ) {}

    /**
     * Upload one or more building or room listing photos. Admin only.
     */
    public function store(UploadListingPhotosRequest $request, int $propertyId): JsonResponse
    {
        $files = $request->file('photos') ?? [];
        if ($request->hasFile('photo')) {
            $files[] = $request->file('photo');
        }

        $roomId = $request->filled('room_id') ? (int) $request->input('room_id') : null;

        try {
            $photos = $this->listingService->uploadPhotos($propertyId, $files, $roomId);

            return response()->json([
                'message' => 'Listing photos uploaded successfully.',
                'data' => ListingPhotoResource::collection($photos),
            ], 201);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Property not found.'], 404);
        } catch (DomainException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatusCode());
        }
    }

    /**
     * Promote a photo to cover image. Admin only.
     */
    public function setCover(int $id): JsonResponse
    {
        try {
            $photo = $this->listingService->setCoverPhoto($id);

            return response()->json([
                'message' => 'Cover photo updated.',
                'data' => new ListingPhotoResource($photo),
            ]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Photo not found.'], 404);
        }
    }

    /**
     * Delete a listing photo. Admin only.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $this->listingService->deletePhoto($id);

            return response()->json([
                'message' => 'Photo removed.',
            ]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Photo not found.'], 404);
        }
    }
}
