<?php

namespace App\Http\Controllers;

use App\Http\Requests\Tenant\ApproveTenantRequest;
use App\Http\Requests\Tenant\UpdateTenantRequest;
use App\Http\Resources\BillResource;
use App\Http\Resources\MaintenanceResource;
use App\Http\Resources\TenantResource;
use App\Services\TenantService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TenantController extends Controller
{
    public function __construct(
        protected TenantService $tenantService
    ) {}

    /**
     * List all tenants with filters (status, search, property_id). Admin only.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user || $user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $filters = [];

        if ($request->filled('status')) {
            $filters['status'] = $request->status;
        }

        if ($request->filled('property_id')) {
            $filters['property_id'] = $request->property_id;
        }

        if ($request->filled('search')) {
            $filters['search'] = $request->search;
        }

        $perPage = min((int) $request->input('per_page', 50), 250);
        $paginated = $this->tenantService->listTenants($filters, $perPage);

        return response()->json([
            'data' => TenantResource::collection($paginated->getCollection()),
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
     * Show a single tenant with property, bills, and maintenance tickets.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $tenant = $this->tenantService->getTenantDetails($id);

        if (! $tenant) {
            return response()->json(['message' => 'Tenant not found.'], 404);
        }

        if ($user && $user->role === 'tenant') {
            $isOwn = ($tenant->user_id && $tenant->user_id === $user->id) || ($tenant->email === $user->email);
            if (! $isOwn) {
                return response()->json(['message' => 'Unauthorized to view this tenant profile.'], 403);
            }
        }

        $data = (new TenantResource($tenant))->toArray($request);
        $data['bills'] = BillResource::collection($tenant->bills);
        $data['maintenance_tickets'] = MaintenanceResource::collection($tenant->maintenanceTickets);

        return response()->json([
            'data' => $data,
        ]);
    }

    /**
     * Update tenant information.
     */
    public function update(UpdateTenantRequest $request, int $id): JsonResponse
    {
        try {
            $tenant = $this->tenantService->updateTenant($id, $request->validated());

            return response()->json([
                'message' => 'Tenant updated successfully.',
                'data' => new TenantResource($tenant),
                'tenant' => new TenantResource($tenant),
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Tenant not found.'], 404);
        }
    }

    /**
     * Approve a pending tenant application and assign room as occupied. Admin only.
     */
    public function approve(ApproveTenantRequest $request, int $id): JsonResponse
    {
        $validated = $request->validated();

        try {
            $tenant = $this->tenantService->approveTenant(
                $id,
                $validated['move_in_date'] ?? null,
                isset($validated['advance_paid']) ? (float) $validated['advance_paid'] : null
            );

            return response()->json([
                'message' => 'Tenant approved successfully.',
                'tenant' => new TenantResource($tenant),
                'data' => new TenantResource($tenant),
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Tenant not found.'], 404);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 409);
        }
    }

    /**
     * Reject a pending tenant application. Admin only.
     */
    public function reject(int $id): JsonResponse
    {
        if (request()->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        try {
            $this->tenantService->rejectTenant($id);

            return response()->json([
                'message' => 'Tenant application rejected.',
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Tenant not found.'], 404);
        }
    }

    /**
     * Mark a tenant as vacated and release the room. Admin only.
     */
    public function vacate(int $id): JsonResponse
    {
        if (request()->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        try {
            $this->tenantService->vacateTenant($id);

            return response()->json([
                'message' => 'Tenant vacated. Room is now vacant.',
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Tenant not found.'], 404);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Delete a tenant record. Admin only.
     */
    public function destroy(int $id): JsonResponse
    {
        if (request()->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        try {
            $this->tenantService->deleteTenant($id);

            return response()->json([
                'message' => 'Tenant deleted successfully.',
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Tenant not found.'], 404);
        }
    }
}
