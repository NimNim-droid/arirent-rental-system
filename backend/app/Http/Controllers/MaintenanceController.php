<?php

namespace App\Http\Controllers;

use App\Http\Requests\Maintenance\StoreMaintenanceRequest;
use App\Http\Requests\Maintenance\UpdateMaintenanceRequest;
use App\Http\Resources\MaintenanceResource;
use App\Models\MaintenanceTicket;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MaintenanceController extends Controller
{
    /**
     * List maintenance tickets. Role-scoped.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = MaintenanceTicket::with(['tenant:id,name,room,property_id', 'tenant.property:id,name'])->latest();

        // Role-based filtering
        if ($user && $user->role === 'tenant') {
            $tenant = Tenant::where('user_id', $user->id)
                ->orWhere('email', $user->email)
                ->first();

            if (! $tenant) {
                return response()->json(['data' => []]);
            }

            $query->where('tenant_id', $tenant->id);
        } else {
            // Admin filters
            if ($request->filled('tenant_id')) {
                $query->where('tenant_id', $request->tenant_id);
            }

            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }

            if ($request->filled('property_id')) {
                $query->where('property_id', $request->property_id);
            }
        }

        $perPage = min((int) $request->input('per_page', 50), 250);
        $paginated = $query->paginate($perPage);

        return response()->json([
            'data' => MaintenanceResource::collection($paginated->getCollection()),
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
     * Submit a new maintenance ticket.
     */
    public function store(StoreMaintenanceRequest $request): JsonResponse
    {
        $user = $request->user();
        $tenant = Tenant::where('user_id', $user->id)
            ->orWhere('email', $user->email)
            ->first();

        $validated = $request->validated();

        $tenantId = ($user->role === 'tenant') ? $tenant?->id : ($validated['tenant_id'] ?? $tenant?->id);

        if (! $tenantId) {
            return response()->json(['message' => 'Tenant profile required to submit ticket.'], 422);
        }

        $activeTenant = Tenant::find($tenantId);

        if (! $activeTenant) {
            return response()->json(['message' => 'Tenant not found.'], 404);
        }

        $photoUrl = $validated['photo_url'] ?? null;
        if ($request->hasFile('photo')) {
            $path = $request->file('photo')->store('maintenance', 'public');
            $photoUrl = '/storage/' . $path;
        }

        $ticket = MaintenanceTicket::create([
            'tenant_id' => $activeTenant->id,
            'property_id' => $activeTenant->property_id,
            'room' => $activeTenant->room,
            'type' => $validated['type'],
            'description' => $validated['description'],
            'priority' => $validated['priority'],
            'photo_url' => $photoUrl,
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Maintenance ticket submitted successfully.',
            'data' => new MaintenanceResource($ticket),
        ], 201);
    }

    /**
     * Update ticket status, dispatch technician, or mark resolved. Admin only.
     */
    public function update(UpdateMaintenanceRequest $request, int $id): JsonResponse
    {
        $ticket = MaintenanceTicket::find($id);

        if (! $ticket) {
            return response()->json(['message' => 'Ticket not found.'], 404);
        }

        $validated = $request->validated();

        if (isset($validated['status']) && $validated['status'] === 'resolved' && ! $ticket->resolved_date) {
            $ticket->resolved_date = now();
        }

        $ticket->update($validated);

        return response()->json([
            'message' => 'Ticket updated successfully.',
            'data' => new MaintenanceResource($ticket),
        ]);
    }

    /**
     * Delete a maintenance ticket. Admin only.
     */
    public function destroy(int $id): JsonResponse
    {
        if (request()->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $ticket = MaintenanceTicket::find($id);

        if (! $ticket) {
            return response()->json(['message' => 'Ticket not found.'], 404);
        }

        $ticket->delete();

        return response()->json([
            'message' => 'Ticket deleted successfully.',
        ]);
    }
}
