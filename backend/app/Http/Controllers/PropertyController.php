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
        $data = \Illuminate\Support\Facades\Cache::remember('all_properties_with_counts', 60, function () {
            $properties = Property::withCount([
                'rooms',
                'rooms as occupied_count' => function ($query) {
                    $query->where('status', 'occupied');
                },
            ])->get();

            return $properties->map(function ($prop) {
                return [
                    'id' => (string) $prop->id,
                    'name' => $prop->name,
                    'city' => $prop->city,
                    'address' => $prop->address,
                    'rooms_count' => $prop->rooms_count,
                    'occupied_count' => $prop->occupied_count,
                ];
            })->all();
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
        if ($request->user() && $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'city' => 'required|string|max:100',
            'address' => 'required|string|max:255',
        ]);

        $property = Property::create($validated);
        \Illuminate\Support\Facades\Cache::forget('all_properties_with_counts');
        \Illuminate\Support\Facades\Cache::forget('admin_stats_all');

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

    /**
     * Update an existing property.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        if ($request->user() && $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $property = Property::find($id);
        if (! $property) {
            return response()->json(['message' => 'Property not found.'], 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'city' => 'sometimes|required|string|max:100',
            'address' => 'sometimes|required|string|max:255',
        ]);

        $property->update($validated);
        \Illuminate\Support\Facades\Cache::forget('all_properties_with_counts');
        \Illuminate\Support\Facades\Cache::forget('admin_stats_all');

        return response()->json([
            'message' => 'Property updated successfully.',
            'data' => [
                'id' => (string) $property->id,
                'name' => $property->name,
                'city' => $property->city,
                'address' => $property->address,
            ],
        ]);
    }

    /**
     * Delete a property if it has no occupied units.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        if ($request->user() && $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $property = Property::withCount([
            'rooms as occupied_rooms' => function ($q) {
                $q->where('status', 'occupied');
            },
        ])->find($id);

        if (! $property) {
            return response()->json(['message' => 'Property not found.'], 404);
        }

        if ($property->occupied_rooms > 0) {
            return response()->json([
                'message' => 'Cannot delete property with occupied rooms. Please vacate or reassign tenants first.',
            ], 422);
        }

        // Remove vacant/reserved rooms and the property
        $property->rooms()->delete();
        $property->delete();

        \Illuminate\Support\Facades\Cache::forget('all_properties_with_counts');
        \Illuminate\Support\Facades\Cache::forget('admin_stats_all');

        return response()->json(['message' => 'Property deleted successfully.']);
    }
}
