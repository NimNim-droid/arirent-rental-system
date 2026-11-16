<?php

namespace App\Http\Controllers;

use App\Exceptions\DomainException;
use App\Http\Requests\Reading\StoreReadingRequest;
use App\Http\Resources\ReadingResource;
use App\Services\UtilityService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReadingController extends Controller
{
    public function __construct(
        protected UtilityService $utilityService
    ) {}

    /**
     * List meter readings. Tenants only see their own; Admins see all.
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['tenant_id', 'property_id', 'month']);
        $perPage = min((int) $request->input('per_page', 50), 250);
        $paginated = $this->utilityService->listReadings($request->user(), $filters, $perPage);

        if (! $paginated) {
            return response()->json(['data' => []]);
        }

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

        try {
            $result = $this->utilityService->recordReading(
                (int) $validated['tenant_id'],
                (float) $validated['prev_reading'],
                (float) $validated['curr_reading'],
                $validated['date'],
                $validated['meter_photo_url'] ?? null,
                $request->file('meter_photo')
            );
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

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
    public function show(Request $request, int $id): JsonResponse
    {
        try {
            $reading = $this->utilityService->getReadingDetails($request->user(), $id);

            return response()->json([
                'data' => new ReadingResource($reading),
            ]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Reading not found.'], 404);
        } catch (DomainException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatusCode());
        }
    }

    /**
     * Delete a utility reading. Admin only.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $this->utilityService->deleteReading($id);

            return response()->json([
                'message' => 'Utility reading deleted successfully.',
            ]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Reading not found.'], 404);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}
