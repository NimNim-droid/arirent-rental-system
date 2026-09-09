<?php

namespace App\Http\Controllers;

use App\Models\Property;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PropertyController extends Controller
{
    /**
     * List all properties with rooms and occupancy counts.
     */
    public function index(): JsonResponse
    {
        $properties = Property::withCount([
            'rooms',
            'rooms as occupied_count' => function ($query) {
                $query->where('status', 'occupied');
            },
        ])->get();

        $data = $properties->map(function ($prop) {
            return [
                'id' => (string) $prop->id,
                'name' => $prop->name,
                'city' => $prop->city,
                'address' => $prop->address,
                'rooms_count' => $prop->rooms_count,
                'occupied_count' => $prop->occupied_count,
            ];
        });

        return response()->json([
            'data' => $data,
        ]);
    }

    /**
     * Create a new property.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'city' => 'required|string|max:100',
            'address' => 'required|string|max:255',
        ]);

        $property = Property::create($validated);

        return response()->json([
            'message' => 'Property created successfully.',
            'data' => [
                'id' => (string) $property->id,
                'name' => $property->name,
                'city' => $property->city,
                'address' => $property->address,
                'rooms_count' => 0,
                'occupied_count' => 0,
            ],
        ], 201);
    }

    /**
     * Display a specific property with its rooms.
     */
    public function show(int $id): JsonResponse
    {
        $property = Property::with('rooms')->find($id);

        if (! $property) {
            return response()->json(['message' => 'Property not found.'], 404);
        }

        return response()->json([
            'data' => [
                'id' => (string) $property->id,
                'name' => $property->name,
                'city' => $property->city,
                'address' => $property->address,
                'rooms' => $property->rooms->map(fn ($r) => [
                    'id' => (string) $r->id,
                    'room_number' => $r->room_number,
                    'rent' => (float) $r->rent,
                    'status' => $r->status,
                ]),
            ],
        ]);
    }
}
