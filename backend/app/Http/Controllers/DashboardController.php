<?php

namespace App\Http\Controllers;

use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(
        protected DashboardService $dashboardService
    ) {}

    /**
     * Admin dashboard aggregated statistics.
     */
    public function stats(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $propertyId = $request->query('property_id') ? (int) $request->query('property_id') : null;
        $data = $this->dashboardService->getAdminStats($propertyId);

        return response()->json([
            'data' => $data,
        ]);
    }

    /**
     * Tenant dashboard metrics and active lease summary.
     */
    public function tenantDashboard(Request $request): JsonResponse
    {
        $data = $this->dashboardService->getTenantDashboard($request->user());

        if (! $data) {
            return response()->json(['message' => 'Tenant profile not found.'], 404);
        }

        return response()->json([
            'data' => $data,
        ]);
    }
}
