<?php

namespace App\Http\Controllers;

use App\Models\Room;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TenantController extends Controller
{
    /**
     * List all tenants with filters (status, search, property_id).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Tenant::with('property')->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('property_id')) {
            $query->where('property_id', $request->property_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%")
                    ->orWhere('room', 'like', "%{$search}%");
            });
        }

        $tenants = $query->get();

        $data = $tenants->map(function ($t) {
            return [
                'id' => (string) $t->id,
                'username' => $t->username,
                'name' => $t->name,
                'email' => $t->email,
                'phone' => $t->phone,
                'property_id' => (string) $t->property_id,
                'property_name' => $t->property?->name,
                'property_address' => $t->property?->address,
                'room' => $t->room,
                'status' => $t->status,
                'balance' => (float) $t->balance,
                'water_rate' => (float) $t->water_rate,
                'lease_end' => $t->lease_end ? $t->lease_end->format('Y-m-d') : null,
                'vacated_date' => $t->vacated_date ? $t->vacated_date->format('Y-m-d H:i:s') : null,
            ];
        });

        return response()->json([
            'data' => $data,
        ]);
    }

    /**
     * Show a single tenant with property and bills.
     */
    public function show(int $id): JsonResponse
    {
        $tenant = Tenant::with(['property', 'bills' => fn ($q) => $q->latest()->take(5), 'maintenanceTickets' => fn ($q) => $q->latest()->take(5)])
            ->find($id);

        if (! $tenant) {
            return response()->json(['message' => 'Tenant not found.'], 404);
        }

        return response()->json([
            'data' => [
                'id' => (string) $tenant->id,
                'username' => $tenant->username,
                'name' => $tenant->name,
                'email' => $tenant->email,
                'phone' => $tenant->phone,
                'property_id' => (string) $tenant->property_id,
                'property_name' => $tenant->property?->name,
                'property_address' => $tenant->property?->address,
                'room' => $tenant->room,
                'status' => $tenant->status,
                'balance' => (float) $tenant->balance,
                'water_rate' => (float) $tenant->water_rate,
                'lease_end' => $tenant->lease_end ? $tenant->lease_end->format('Y-m-d') : null,
                'bills' => $tenant->bills,
                'maintenance_tickets' => $tenant->maintenanceTickets,
            ],
        ]);
    }

    /**
     * Update tenant information (water_rate, lease_end, phone, balance).
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $tenant = Tenant::find($id);

        if (! $tenant) {
            return response()->json(['message' => 'Tenant not found.'], 404);
        }

        $validated = $request->validate([
            'phone' => 'nullable|string|max:20',
            'water_rate' => 'nullable|numeric|min:0',
            'balance' => 'nullable|numeric',
            'lease_end' => 'nullable|date',
            'room' => 'nullable|string|max:50',
        ]);

        $tenant->update($validated);

        return response()->json([
            'message' => 'Tenant updated successfully.',
            'tenant' => [
                'id' => (string) $tenant->id,
                'name' => $tenant->name,
                'status' => $tenant->status,
                'room' => $tenant->room,
                'balance' => (float) $tenant->balance,
                'water_rate' => (float) $tenant->water_rate,
                'lease_end' => $tenant->lease_end ? $tenant->lease_end->format('Y-m-d') : null,
            ],
        ]);
    }

    /**
     * Approve a pending tenant application and assign room as occupied.
     */
    public function approve(int $id): JsonResponse
    {
        $tenant = Tenant::find($id);

        if (! $tenant) {
            return response()->json(['message' => 'Tenant not found.'], 404);
        }

        // Find the room in the assigned property
        $room = Room::where('property_id', $tenant->property_id)
            ->where('room_number', $tenant->room)
            ->first();

        // Check if room is already occupied by someone else
        if ($room && $room->status === 'occupied') {
            $otherTenant = Tenant::where('property_id', $tenant->property_id)
                ->where('room', $tenant->room)
                ->where('status', 'active')
                ->where('id', '!=', $tenant->id)
                ->first();

            if ($otherTenant) {
                return response()->json([
                    'message' => "Room {$tenant->room} is already occupied by {$otherTenant->name}.",
                ], 409);
            }
        }

        // Update tenant status to active
        $tenant->update([
            'status' => 'active',
            'lease_end' => $tenant->lease_end ?? now()->addYear()->format('Y-m-d'),
        ]);

        // Update room status to occupied
        if ($room) {
            $room->update(['status' => 'occupied']);
        }

        return response()->json([
            'message' => 'Tenant approved successfully.',
            'tenant' => [
                'id' => (string) $tenant->id,
                'name' => $tenant->name,
                'email' => $tenant->email,
                'room' => $tenant->room,
                'status' => $tenant->status,
                'lease_end' => $tenant->lease_end ? $tenant->lease_end->format('Y-m-d') : null,
            ],
        ]);
    }

    /**
     * Reject a pending tenant application.
     */
    public function reject(int $id): JsonResponse
    {
        $tenant = Tenant::find($id);

        if (! $tenant) {
            return response()->json(['message' => 'Tenant not found.'], 404);
        }

        $tenant->update(['status' => 'inactive']);

        // Free up the reserved room
        $room = Room::where('property_id', $tenant->property_id)
            ->where('room_number', $tenant->room)
            ->first();

        if ($room && $room->status === 'reserved') {
            $room->update(['status' => 'vacant']);
        }

        return response()->json([
            'message' => 'Tenant application rejected.',
        ]);
    }

    /**
     * Mark a tenant as vacated and release the room.
     */
    public function vacate(int $id): JsonResponse
    {
        $tenant = Tenant::find($id);

        if (! $tenant) {
            return response()->json(['message' => 'Tenant not found.'], 404);
        }

        $tenant->update([
            'status' => 'inactive',
            'vacated_date' => now(),
        ]);

        // Free up room
        $room = Room::where('property_id', $tenant->property_id)
            ->where('room_number', $tenant->room)
            ->first();

        if ($room) {
            $room->update(['status' => 'vacant']);
        }

        return response()->json([
            'message' => 'Tenant vacated. Room is now vacant.',
        ]);
    }

    /**
     * Delete a tenant record.
     */
    public function destroy(int $id): JsonResponse
    {
        $tenant = Tenant::find($id);

        if (! $tenant) {
            return response()->json(['message' => 'Tenant not found.'], 404);
        }

        // Release room if occupied
        $room = Room::where('property_id', $tenant->property_id)
            ->where('room_number', $tenant->room)
            ->first();

        if ($room && in_array($room->status, ['reserved', 'occupied'])) {
            $room->update(['status' => 'vacant']);
        }

        $tenant->delete();

        return response()->json([
            'message' => 'Tenant deleted successfully.',
        ]);
    }
}
