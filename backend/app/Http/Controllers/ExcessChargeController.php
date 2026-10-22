<?php

namespace App\Http\Controllers;

use App\Http\Resources\ExcessChargeResource;
use App\Models\ExcessCharge;
use App\Repositories\Contracts\TenantRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExcessChargeController extends Controller
{
    public function __construct(
        protected TenantRepositoryInterface $tenantRepo
    ) {}

    /**
     * List excess charges. Tenants see only their own; Admins see all with filters.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = ExcessCharge::with(['tenant:id,name,room', 'bill:id,date,status'])->latest('charge_date');

        if ($user && $user->role === 'tenant') {
            $tenant = $this->tenantRepo->findByUserIdOrEmail($user->id, $user->email);
            if (! $tenant) {
                return response()->json(['data' => []]);
            }
            $query->where('tenant_id', $tenant->id);
        } else {
            if ($request->filled('tenant_id')) {
                $query->where('tenant_id', $request->tenant_id);
            }
            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }
        }

        $charges = $query->get();

        return response()->json([
            'data' => ExcessChargeResource::collection($charges),
        ]);
    }

    /**
     * Create an excess charge for a tenant. Admin only.
     */
    public function store(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $validated = $request->validate([
            'tenant_id' => ['required', 'exists:tenants,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'charge_date' => ['required', 'date'],
        ]);

        $charge = ExcessCharge::create([
            'tenant_id' => $validated['tenant_id'],
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'amount' => $validated['amount'],
            'charge_date' => $validated['charge_date'],
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Excess charge recorded successfully.',
            'data' => new ExcessChargeResource($charge->load('tenant:id,name,room')),
        ], 201);
    }

    /**
     * Delete or waive an excess charge. Admin only.
     */
    public function destroy(int $id): JsonResponse
    {
        if (request()->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $charge = ExcessCharge::find($id);
        if (! $charge) {
            return response()->json(['message' => 'Excess charge not found.'], 404);
        }

        if ($charge->status === 'billed') {
            return response()->json(['message' => 'Cannot delete an excess charge that has already been attached to a generated bill.'], 422);
        }

        $charge->delete();

        return response()->json([
            'message' => 'Excess charge removed successfully.',
        ]);
    }
}
