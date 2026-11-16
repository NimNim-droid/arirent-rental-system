<?php

namespace App\Http\Controllers;

use App\Http\Requests\ExcessCharge\StoreExcessChargeRequest;
use App\Http\Resources\ExcessChargeResource;
use App\Services\ExcessChargeService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class ExcessChargeController extends Controller
{
    public function __construct(
        protected ExcessChargeService $excessChargeService
    ) {}

    /**
     * List excess charges. Tenants see only their own; Admins see all with filters.
     */
    public function index(Request $request): JsonResponse
    {
        $charges = $this->excessChargeService->listCharges(
            $request->user(),
            $request->only(['tenant_id', 'status'])
        );

        return response()->json([
            'data' => ExcessChargeResource::collection($charges),
        ]);
    }

    /**
     * Create an excess charge for a tenant. Admin only.
     */
    public function store(StoreExcessChargeRequest $request): JsonResponse
    {
        $charge = $this->excessChargeService->createCharge($request->validated());

        return response()->json([
            'message' => 'Excess charge recorded successfully.',
            'data' => new ExcessChargeResource($charge),
        ], 201);
    }

    /**
     * Delete or waive an excess charge. Admin only.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $this->excessChargeService->deleteCharge($id);

            return response()->json([
                'message' => 'Excess charge removed successfully.',
            ]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Excess charge not found.'], 404);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}
