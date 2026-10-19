<?php

namespace App\Http\Controllers;

use App\Http\Requests\Property\StorePropertyRequest;
use App\Http\Requests\Property\UpdatePropertyRequest;
use App\Http\Resources\PropertyResource;
use App\Services\PropertyService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PropertyController extends Controller
{
    public function __construct(
        protected PropertyService $propertyService
    ) {}

    /**
     * List all properties with rooms and occupancy counts.
     */
    public function index(): JsonResponse
    {
        $properties = $this->propertyService->getAllPropertiesWithCounts();

        return response()->json([
            'data' => PropertyResource::collection($properties),
        ]);
    }

    /**
     * Create a new property.
     */
    public function store(StorePropertyRequest $request): JsonResponse
    {
        $property = $this->propertyService->createProperty($request->validated());

        return response()->json([
            'message' => 'Property created successfully.',
            'data' => new PropertyResource($property),
        ], 201);
    }

    /**
     * Display a specific property with its rooms.
     */
    public function show(int $id): JsonResponse
    {
        $property = $this->propertyService->getProperty($id);

        if (! $property) {
            return response()->json(['message' => 'Property not found.'], 404);
        }

        return response()->json([
            'data' => new PropertyResource($property),
        ]);
    }

    /**
     * Update an existing property. Admin only.
     */
    public function update(UpdatePropertyRequest $request, int $id): JsonResponse
    {
        try {
            $property = $this->propertyService->updateProperty($id, $request->validated());

            return response()->json([
                'message' => 'Property updated successfully.',
                'data' => new PropertyResource($property),
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Property not found.'], 404);
        }
    }

    /**
     * Delete a property if it has no occupied units.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        if ($request->user() && $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        try {
            $this->propertyService->deleteProperty($id);

            return response()->json(['message' => 'Property deleted successfully.']);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Property not found.'], 404);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}
