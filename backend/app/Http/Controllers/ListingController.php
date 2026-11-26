<?php

namespace App\Http\Controllers;

use App\Http\Resources\PropertyResource;
use App\Http\Resources\PublicPropertyResource;
use App\Http\Resources\PublicRoomResource;
use App\Services\ListingService;
use App\Support\PublicFile;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ListingController extends Controller
{
    public function __construct(
        protected ListingService $listingService
    ) {}

    /**
     * Public property & unit catalog with optional search/city/budget/capacity filters.
     */
    public function index(Request $request): JsonResponse
    {
        $filters = [];

        if ($request->filled('q')) {
            $filters['q'] = (string) $request->input('q');
        }
        if ($request->filled('city') && $request->input('city') !== 'all') {
            $filters['city'] = (string) $request->input('city');
        }
        if ($request->filled('min_rent') && is_numeric($request->input('min_rent'))) {
            $filters['min_rent'] = (float) $request->input('min_rent');
        }
        if ($request->filled('max_rent') && is_numeric($request->input('max_rent'))) {
            $filters['max_rent'] = (float) $request->input('max_rent');
        }
        if ($request->filled('capacity') && is_numeric($request->input('capacity'))) {
            $filters['capacity'] = (int) $request->input('capacity');
        }

        $result = $this->listingService->getPublicListings($filters);

        return response()->json([
            'data' => PublicPropertyResource::collection($result['listings']),
            'meta' => [
                'cities' => $result['cities'],
                'total' => $result['listings']->count(),
            ],
        ]);
    }

    /**
     * Public detail view for a single property and its published rooms.
     */
    public function showProperty(int $id): JsonResponse
    {
        try {
            $property = $this->listingService->getPublicProperty($id);

            return response()->json([
                'data' => new PublicPropertyResource($property),
            ]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Listing not found.'], 404);
        }
    }

    /**
     * Public detail view for a single listed room.
     */
    public function showRoom(int $id): JsonResponse
    {
        try {
            $room = $this->listingService->getPublicRoom($id);

            return response()->json([
                'data' => new PublicRoomResource($room),
            ]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Room listing not found.'], 404);
        }
    }

    /**
     * Admin view of a property's full listing configuration, photos, and all rooms.
     */
    public function adminShowProperty(int $id): JsonResponse
    {
        try {
            $property = $this->listingService->getAdminPropertyListing($id);

            return response()->json([
                'data' => new PropertyResource($property),
            ]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Property not found.'], 404);
        }
    }

    /**
     * Stream a public listing photo.
     */
    public function media(string $path): StreamedResponse
    {
        return PublicFile::response($path);
    }
}
