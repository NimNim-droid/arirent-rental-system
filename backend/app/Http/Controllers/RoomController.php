<?php

namespace App\Http\Controllers;

use App\Models\Room;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoomController extends Controller
{
    /**
     * List all rooms with optional filtering by property_id or status.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Room::with('property:id,name,city,address');

        if ($request->filled('property_id')) {
            $query->where('property_id', $request->property_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $rooms = $query->get();

        $data = $rooms->map(function ($r) {
            return [
                'id' => (string) $r->id,
                'property_id' => (string) $r->property_id,
                'room_number' => $r->room_number,
                'rent' => (float) $r->rent,
                'status' => $r->status,
                'property' => $r->property ? [
                    'id' => (string) $r->property->id,
                    'name' => $r->property->name,
                    'city' => $r->property->city,
                    'address' => $r->property->address,
                ] : null,
            ];
        });

        return response()->json([
            'data' => $data,
        ]);
    }

    /**
     * Create a new room.
     */
    public function store(Request $request): JsonResponse
    {
        if ($request->user() && $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $validated = $request->validate([
            'property_id' => 'required|exists:properties,id',
            'room_number' => 'required|string|max:50',
            'rent' => 'required|numeric|min:0',
            'status' => 'nullable|in:vacant,reserved,occupied',
        ]);

        $room = Room::create($validated);
        \Illuminate\Support\Facades\Cache::forget('all_properties_with_counts');
        \Illuminate\Support\Facades\Cache::forget('admin_stats_all');

        return response()->json([
            'message' => 'Room created successfully.',
            'data' => [
                'id' => (string) $room->id,
                'property_id' => (string) $room->property_id,
                'room_number' => $room->room_number,
                'rent' => (float) $room->rent,
                'status' => $room->status,
            ],
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

        $room = Room::find($id);
        if (! $room) {
            return response()->json(['message' => 'Room not found.'], 404);
        }

        $validated = $request->validate([
            'room_number' => 'sometimes|required|string|max:50',
            'rent' => 'sometimes|required|numeric|min:0',
            'status' => 'sometimes|required|in:vacant,reserved,occupied',
        ]);

        $room->update($validated);
        \Illuminate\Support\Facades\Cache::forget('all_properties_with_counts');
        \Illuminate\Support\Facades\Cache::forget('admin_stats_all');

        return response()->json([
            'message' => 'Room updated successfully.',
            'data' => [
                'id' => (string) $room->id,
                'property_id' => (string) $room->property_id,
                'room_number' => $room->room_number,
                'rent' => (float) $room->rent,
                'status' => $room->status,
            ],
        ]);
    }

    /**
     * Delete a room if it is not occupied.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        if ($request->user() && $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $room = Room::find($id);
        if (! $room) {
            return response()->json(['message' => 'Room not found.'], 404);
        }

        if ($room->status === 'occupied') {
            return response()->json([
                'message' => 'Cannot delete an occupied room. Please vacate the tenant first.',
            ], 422);
        }

        $room->delete();
        \Illuminate\Support\Facades\Cache::forget('all_properties_with_counts');
        \Illuminate\Support\Facades\Cache::forget('admin_stats_all');

        return response()->json(['message' => 'Room deleted successfully.']);
    }
}
