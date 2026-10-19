<?php

namespace App\Http\Controllers;

use App\Http\Requests\Room\StoreRoomRequest;
use App\Http\Resources\RoomResource;
use App\Services\PropertyService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoomController extends Controller
{
    public function __construct(
        protected PropertyService $propertyService
    ) {}

    /**
     * List all rooms with optional filtering by property_id or status.
     */
    public function index(Request $request): JsonResponse
    {
        $filters = [];

        if ($request->filled('property_id')) {
            $filters['property_id'] = $request->property_id;
        }

        if ($request->filled('status')) {
            $filters['status'] = $request->status;
        }

        $rooms = $this->propertyService->getRooms($filters);

        return response()->json([
            'data' => RoomResource::collection($rooms),
        ]);
    }

    /**
     * Create a new room.
     */
    public function store(StoreRoomRequest $request): JsonResponse
    {
        $room = $this->propertyService->createRoom($request->validated());

        return response()->json([
            'message' => 'Room created successfully.',
            'data' => new RoomResource($room),
        ], 201);
    }

    /**
     * Update an existing room.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        if ($request->user() && $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $validated = $request->validate([
            'room_number' => 'sometimes|required|string|max:50',
            'rent' => 'sometimes|required|numeric|min:0',
            'status' => 'sometimes|required|in:vacant,reserved,occupied',
        ]);

        try {
            $room = $this->propertyService->updateRoom($id, $validated);

            return response()->json([
                'message' => 'Room updated successfully.',
                'data' => new RoomResource($room),
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Room not found.'], 404);
        }
    }

    /**
     * Delete a room if it is not occupied.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        if ($request->user() && $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        try {
            $this->propertyService->deleteRoom($id);

            return response()->json(['message' => 'Room deleted successfully.']);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Room not found.'], 404);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}
