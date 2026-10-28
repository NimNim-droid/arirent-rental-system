<?php

namespace App\Http\Controllers;

use App\Services\ReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct(
        protected ReportService $reportService
    ) {}

    /**
     * Financial report and revenue analytics.
     */
    public function financial(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $month = $request->query('month');
        $propertyId = $request->query('property_id') ? (int) $request->query('property_id') : null;
        $year = $request->query('year') ? (int) $request->query('year') : null;

        $data = $this->reportService->getFinancialReport($month, $propertyId, $year);

        return response()->json([
            'data' => $data,
        ]);
    }
}
