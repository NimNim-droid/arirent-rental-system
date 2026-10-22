<?php

namespace App\Http\Controllers;

use App\Http\Requests\Reading\StoreReadingRequest;
use App\Http\Resources\ReadingResource;
use App\Repositories\Contracts\ReadingRepositoryInterface;
use App\Repositories\Contracts\TenantRepositoryInterface;
use App\Services\UtilityService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReadingController extends Controller
{
    public function __construct(
        protected ReadingRepositoryInterface $readingRepo,
        protected TenantRepositoryInterface $tenantRepo,
        protected UtilityService $utilityService
    ) {}

    /**
     * List meter readings. Tenants only see their own; Admins see all.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $filters = [];

        // Role-based filtering
        if ($user && $user->role === 'tenant') {
            $tenant = $this->tenantRepo->findByUserIdOrEmail($user->id, $user->email);

            if (! $tenant) {
                return response()->json(['data' => []]);
            }

            $filters['tenant_id'] = $tenant->id;
        } else {
            // Admin filters
            if ($request->filled('tenant_id')) {
                $filters['tenant_id'] = $request->tenant_id;
            }

            if ($request->filled('property_id')) {
                $filters['property_id'] = $request->property_id;
            }

            if ($request->filled('month')) {
                $filters['month'] = $request->month;
            }
        }

        $perPage = min((int) $request->input('per_page', 50), 250);
        $paginated = $this->readingRepo->paginate($perPage, $filters);

        return response()->json([
            'data' => ReadingResource::collection($paginated->getCollection()),
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
     * Store a new meter reading and auto-calculate usage and cost. Admin only.
     */
    public function store(StoreReadingRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $photoUrl = null;
        if ($request->hasFile('meter_photo')) {
            $path = $request->file('meter_photo')->store('meter_proofs', 'public');
            $photoUrl = '/storage/' . $path;
        } elseif (! empty($validated['meter_photo_url'])) {
            $photoUrl = $validated['meter_photo_url'];
        }

        $result = $this->utilityService->recordReading(
            (int) $validated['tenant_id'],
            (float) $validated['prev_reading'],
            (float) $validated['curr_reading'],
            $validated['date'],
            $photoUrl
        );

        return response()->json([
            'message' => 'Utility reading recorded successfully.' . ($result['bill_updated'] ? ' Associated monthly bill updated.' : ''),
            'data' => new ReadingResource($result['reading']),
            'reading' => new ReadingResource($result['reading']),
            'bill_updated' => $result['bill_updated'],
        ], 201);
    }

    /**
     * Show a single utility reading.
     */
    public function show(int $id): JsonResponse
    {
        $user = request()->user();
        $reading = $this->readingRepo->find($id, ['tenant.property']);

        if (! $reading) {
            return response()->json(['message' => 'Reading not found.'], 404);
        }

        // Tenants may only view their own utility readings (IDOR protection)
        if ($user && $user->role === 'tenant') {
            $tenant = $this->tenantRepo->findByUserIdOrEmail($user->id, $user->email);

            if (! $tenant || $reading->tenant_id !== $tenant->id) {
                return response()->json(['message' => 'Unauthorized to view this reading.'], 403);
            }
        }

        return response()->json([
            'data' => new ReadingResource($reading),
        ]);
    }

    /**
     * Delete a utility reading.
     */
    public function destroy(int $id): JsonResponse
    {
        if (request()->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        try {
            $this->utilityService->deleteReading($id);

            return response()->json([
                'message' => 'Utility reading deleted successfully.',
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Reading not found.'], 404);
        }
    }
}
