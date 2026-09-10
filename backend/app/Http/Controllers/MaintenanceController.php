<?php

namespace App\Http\Controllers;

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
        $query = MaintenanceTicket::with(['tenant.property'])->latest();

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

        $tickets = $query->get();

        $data = $tickets->map(function ($t) {
            return [
                'id' => (string) $t->id,
                'tenant_id' => (string) $t->tenant_id,
                'tenant_name' => $t->tenant?->name,
                'property_id' => (string) $t->property_id,
                'property_name' => $t->tenant?->property?->name,
                'room' => $t->room,
                'type' => $t->type,
                'description' => $t->description,
                'photo_url' => $t->photo_url,
                'priority' => $t->priority,
                'status' => $t->status,
                'technician_name' => $t->technician_name,
                'admin_notes' => $t->admin_notes,
                'resolved_date' => $t->resolved_date ? $t->resolved_date->format('Y-m-d H:i:s') : null,
                'date' => $t->created_at ? $t->created_at->format('Y-m-d') : null,
                'created_at' => $t->created_at ? $t->created_at->format('Y-m-d H:i:s') : null,
            ];
        });

        return response()->json([
            'data' => $data,
        ]);
    }

    /**
     * Submit a new maintenance ticket.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $tenant = Tenant::where('user_id', $user->id)
            ->orWhere('email', $user->email)
            ->first();

        $validated = $request->validate([
            'tenant_id' => 'nullable|exists:tenants,id',
            'type' => 'required|in:plumbing,electrical,appliances,general',
            'description' => 'required|string|max:1000',
            'priority' => 'required|in:normal,urgent',
            'photo_url' => 'nullable|string',
            'photo' => 'nullable|file|mimes:jpg,jpeg,png|max:5120',
        ]);

        $tenantId = $validated['tenant_id'] ?? $tenant?->id;

        if (! $tenantId) {
            return response()->json(['message' => 'Tenant profile required to submit ticket.'], 422);
        }

        $activeTenant = Tenant::find($tenantId);

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
            'data' => $ticket,
        ], 201);
    }

    /**
     * Update ticket status, dispatch technician, or mark resolved.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $ticket = MaintenanceTicket::find($id);

        if (! $ticket) {
            return response()->json(['message' => 'Ticket not found.'], 404);
        }

        $validated = $request->validate([
            'status' => 'nullable|in:pending,in_progress,resolved',
            'technician_name' => 'nullable|string|max:100',
            'admin_notes' => 'nullable|string|max:1000',
        ]);

        if (isset($validated['status']) && $validated['status'] === 'resolved' && ! $ticket->resolved_date) {
            $ticket->resolved_date = now();
        }

        $ticket->update($validated);

        return response()->json([
            'message' => 'Ticket updated successfully.',
            'data' => $ticket,
        ]);
    }
}
