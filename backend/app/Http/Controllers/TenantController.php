<?php

namespace App\Http\Controllers;

use App\Models\Room;
use App\Models\Tenant;
use App\Models\User;
use App\Models\UtilityReading;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TenantController extends Controller
{
    /**
     * List all tenants with filters (status, search, property_id).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Tenant::with('property:id,name,address')->latest();

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

        $perPage = min((int) $request->input('per_page', 50), 250);
        $paginated = $query->paginate($perPage);

        $propertyIds = $paginated->getCollection()->pluck('property_id')->unique()->all();
        $tenantIds = $paginated->getCollection()->pluck('id')->all();

        $rooms = Room::whereIn('property_id', $propertyIds)
            ->get(['property_id', 'room_number', 'rent'])
            ->keyBy(fn ($r) => "{$r->property_id}-{$r->room_number}");

        $latestReadings = UtilityReading::whereIn('tenant_id', $tenantIds)
            ->orderBy('date', 'desc')
            ->get(['tenant_id', 'curr_reading'])
            ->groupBy('tenant_id')
            ->map(fn ($g) => (float) $g->first()->curr_reading);

        $formatTenant = fn ($t) => [
            'id' => (string) $t->id,
            'username' => $t->username,
            'name' => $t->name,
            'email' => $t->email,
            'phone' => $t->phone,
            'property_id' => (string) $t->property_id,
            'property_name' => $t->property?->name,
            'property_address' => $t->property?->address,
            'room' => $t->room,
            'room_rent' => (float) ($rooms->get("{$t->property_id}-{$t->room}")?->rent ?? 0.00),
            'latest_reading' => (float) ($latestReadings->get($t->id) ?? 0.00),
            'status' => $t->status,
            'balance' => (float) $t->balance,
            'water_rate' => (float) $t->water_rate,
            'move_in_date' => $t->move_in_date ? $t->move_in_date->format('Y-m-d') : ($t->created_at ? $t->created_at->format('Y-m-d') : null),
            'billing_day' => $t->getBillingDay(),
            'advance_paid' => (float) $t->advance_paid,
            'lease_end' => $t->lease_end ? $t->lease_end->format('Y-m-d') : null,
            'vacated_date' => $t->vacated_date ? $t->vacated_date->format('Y-m-d H:i:s') : null,
        ];

        return response()->json([
            'data' => $paginated->getCollection()->map($formatTenant),
            'links' => [
                'first' => $paginated->url(1),
                'last' => $paginated->url($paginated->lastPage()),
                'prev' => $paginated->previousPageUrl(),
                'next' => $paginated->nextPageUrl(),
            ],
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
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

        $room = Room::where('property_id', $tenant->property_id)->where('room_number', $tenant->room)->first();
        $latestReading = UtilityReading::where('tenant_id', $tenant->id)->latest('date')->first();

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
                'room_rent' => $room ? (float) $room->rent : 0.00,
                'latest_reading' => $latestReading ? (float) $latestReading->curr_reading : 0.00,
                'status' => $tenant->status,
                'balance' => (float) $tenant->balance,
                'water_rate' => (float) $tenant->water_rate,
                'move_in_date' => $tenant->move_in_date ? $tenant->move_in_date->format('Y-m-d') : ($tenant->created_at ? $tenant->created_at->format('Y-m-d') : null),
                'billing_day' => $tenant->getBillingDay(),
                'advance_paid' => (float) $tenant->advance_paid,
                'lease_end' => $tenant->lease_end ? $tenant->lease_end->format('Y-m-d') : null,
                'bills' => $tenant->bills,
                'maintenance_tickets' => $tenant->maintenanceTickets,
            ],
        ]);
    }

    /**
     * Update tenant information (water_rate, lease_end, phone, balance, move_in_date, advance_paid).
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
            'move_in_date' => 'nullable|date',
            'advance_paid' => 'nullable|numeric|min:0',
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
                'move_in_date' => $tenant->move_in_date ? $tenant->move_in_date->format('Y-m-d') : null,
                'billing_day' => $tenant->getBillingDay(),
                'advance_paid' => (float) $tenant->advance_paid,
                'lease_end' => $tenant->lease_end ? $tenant->lease_end->format('Y-m-d') : null,
            ],
        ]);
    }

    /**
     * Approve a pending tenant application and assign room as occupied. Admin only.
     */
    public function approve(Request $request, int $id): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $tenant = Tenant::find($id);

        if (! $tenant) {
            return response()->json(['message' => 'Tenant not found.'], 404);
        }

        // Find the room in the assigned property
        $room = Room::where('property_id', $tenant->property_id)
            ->where('room_number', $tenant->room)
            ->first();

        if (! $room) {
            return response()->json([
                'message' => "Room {$tenant->room} not found in the assigned property.",
            ], 404);
        }

        // Check if room is already occupied by someone else
        if ($room->status === 'occupied') {
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

        $validated = $request->validate([
            'move_in_date' => 'nullable|date',
            'advance_paid' => 'nullable|numeric|min:0',
        ]);

        // Update tenant status to active with move-in date and advance
        $moveIn = $validated['move_in_date'] ?? $tenant->move_in_date ?? now()->format('Y-m-d');
        $advance = $validated['advance_paid'] ?? $tenant->advance_paid ?? 0.00;

        $tenant->update([
            'status' => 'active',
            'move_in_date' => $moveIn,
            'advance_paid' => $advance,
            'lease_end' => $tenant->lease_end ?? now()->addYear()->format('Y-m-d'),
        ]);

        // Update room status to occupied
        $room->update(['status' => 'occupied']);

        return response()->json([
            'message' => 'Tenant approved successfully.',
            'tenant' => [
                'id' => (string) $tenant->id,
                'name' => $tenant->name,
                'email' => $tenant->email,
                'room' => $tenant->room,
                'status' => $tenant->status,
                'move_in_date' => $tenant->move_in_date ? $tenant->move_in_date->format('Y-m-d') : null,
                'billing_day' => $tenant->getBillingDay(),
                'advance_paid' => (float) $tenant->advance_paid,
                'lease_end' => $tenant->lease_end ? $tenant->lease_end->format('Y-m-d') : null,
            ],
        ]);
    }

    /**
     * Reject a pending tenant application. Admin only.
     */
    public function reject(int $id): JsonResponse
    {
        if (request()->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

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
     * Mark a tenant as vacated and release the room. Admin only.
     */
    public function vacate(int $id): JsonResponse
    {
        if (request()->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $tenant = Tenant::find($id);

        if (! $tenant) {
            return response()->json(['message' => 'Tenant not found.'], 404);
        }

        if ($tenant->status !== 'active') {
            return response()->json(['message' => 'Only active tenants can be vacated.'], 422);
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
     * Delete a tenant record. Admin only.
     */
    public function destroy(int $id): JsonResponse
    {
        if (request()->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

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

        // Also delete associated user account to prevent orphaned records
        if ($tenant->user_id) {
            User::where('id', $tenant->user_id)->delete();
        }

        $tenant->delete();

        return response()->json([
            'message' => 'Tenant deleted successfully.',
        ]);
    }
}
