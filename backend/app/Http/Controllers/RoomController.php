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
        $query = Room::with('property');

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
        $validated = $request->validate([
            'property_id' => 'required|exists:properties,id',
            'room_number' => 'required|string|max:50',
            'rent' => 'required|numeric|min:0',
            'status' => 'nullable|in:vacant,reserved,occupied',
        ]);

        $room = Room::create($validated);

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
}
