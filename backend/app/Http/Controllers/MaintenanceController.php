<?php

namespace App\Http\Controllers;

use App\Http\Requests\Maintenance\StoreMaintenanceRequest;
use App\Http\Requests\Maintenance\UpdateMaintenanceRequest;
use App\Http\Resources\MaintenanceResource;
use App\Services\MaintenanceService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class MaintenanceController extends Controller
{
    public function __construct(
        protected MaintenanceService $maintenanceService
    ) {}

    /**
     * List maintenance tickets. Role-scoped.
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['tenant_id', 'status', 'property_id']);
        $perPage = (int) $request->input('per_page', 50);

        $paginated = $this->maintenanceService->listTickets($request->user(), $filters, $perPage);

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
        try {
            $ticket = $this->maintenanceService->createTicket(
                $request->user(),
                $request->validated(),
                $request->file('photo')
            );

            return response()->json([
                'message' => 'Maintenance ticket submitted successfully.',
                'data' => new MaintenanceResource($ticket),
            ], 201);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Tenant not found.'], 404);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Update ticket status, dispatch technician, or mark resolved. Admin only.
     */
    public function update(UpdateMaintenanceRequest $request, int $id): JsonResponse
    {
        try {
            $ticket = $this->maintenanceService->updateTicket($id, $request->validated());

            return response()->json([
                'message' => 'Ticket updated successfully.',
                'data' => new MaintenanceResource($ticket),
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Ticket not found.'], 404);
        }
    }

    /**
     * Delete a maintenance ticket. Admin only.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        try {
            $this->maintenanceService->deleteTicket($id);

            return response()->json([
                'message' => 'Ticket deleted successfully.',
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Ticket not found.'], 404);
        }
    }
}
