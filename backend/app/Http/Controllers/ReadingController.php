<?php

namespace App\Http\Controllers;

use App\Models\Bill;
use App\Models\Setting;
use App\Models\Tenant;
use App\Models\UtilityReading;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class ReadingController extends Controller
{
    /**
     * List meter readings. Tenants only see their own; Admins see all.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = UtilityReading::with(['tenant:id,name,room,property_id', 'tenant.property:id,name'])->latest('date');

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

            if ($request->filled('property_id')) {
                $propertyId = $request->property_id;
                $query->whereHas('tenant', function ($q) use ($propertyId) {
                    $q->where('property_id', $propertyId);
                });
            }

            if ($request->filled('month')) {
                $monthStart = Carbon::parse($request->month)->startOfMonth()->format('Y-m-d');
                $monthEnd = Carbon::parse($request->month)->endOfMonth()->format('Y-m-d');
                $query->whereBetween('date', [$monthStart, $monthEnd]);
            }
        }

        $formatReading = fn ($r) => [
            'id' => (string) $r->id,
            'tenant_id' => (string) $r->tenant_id,
            'tenant_name' => $r->tenant?->name,
            'room' => $r->tenant?->room,
            'property_name' => $r->tenant?->property?->name,
            'prev_reading' => (float) $r->prev_reading,
            'curr_reading' => (float) $r->curr_reading,
            'usage_kwh' => (float) $r->usage_kwh,
            'amount' => (float) $r->amount,
            'date' => $r->date ? Carbon::parse($r->date)->format('Y-m-d') : null,
            'created_at' => $r->created_at ? $r->created_at->format('Y-m-d H:i:s') : null,
        ];

        $perPage = min((int) $request->input('per_page', 50), 250);
        $paginated = $query->paginate($perPage);

        return response()->json([
            'data' => $paginated->getCollection()->map($formatReading),
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
    public function store(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $validated = $request->validate([
            'tenant_id' => 'required|exists:tenants,id',
            'prev_reading' => 'required|numeric|min:0',
            'curr_reading' => 'required|numeric|gte:prev_reading',
            'date' => 'required|date',
        ]);

        $prev = (float) $validated['prev_reading'];
        $curr = (float) $validated['curr_reading'];
        $usage = max(0, round($curr - $prev, 2));

        // Get electricity rate from cached settings
        $settings = Setting::getGlobal();
        $elecRate = (float) $settings->elec_rate;
        $amount = round($usage * $elecRate, 2);

        $reading = UtilityReading::create([
            'tenant_id' => $validated['tenant_id'],
            'prev_reading' => $prev,
            'curr_reading' => $curr,
            'usage_kwh' => $usage,
            'amount' => $amount,
            'date' => $validated['date'],
        ]);

        // Auto-sync with unpaid bill for the same month if one exists
        $readingDate = Carbon::parse($validated['date']);
        $monthStart = $readingDate->copy()->startOfMonth()->format('Y-m-d');
        $monthEnd = $readingDate->copy()->endOfMonth()->format('Y-m-d');

        $bill = Bill::where('tenant_id', $validated['tenant_id'])
            ->where('status', 'unpaid')
            ->whereBetween('date', [$monthStart, $monthEnd])
            ->first();

        $billUpdated = false;
        if ($bill) {
            $oldElec = (float) $bill->electricity;
            $bill->electricity = $amount;
            $bill->elec_usage = $usage;
            $bill->total_amount = (float) $bill->rent + $amount + (float) $bill->water + (float) $bill->late_fee;
            $bill->save();

            // Adjust tenant balance by the difference
            $diff = $amount - $oldElec;
            $tenant = Tenant::find($validated['tenant_id']);
            if ($tenant && $diff != 0) {
                $tenant->increment('balance', $diff);
            }
            $billUpdated = true;
        }

        return response()->json([
            'message' => 'Utility reading recorded successfully.' . ($billUpdated ? ' Associated monthly bill updated.' : ''),
            'reading' => [
                'id' => (string) $reading->id,
                'tenant_id' => (string) $reading->tenant_id,
                'prev_reading' => (float) $reading->prev_reading,
                'curr_reading' => (float) $reading->curr_reading,
                'usage_kwh' => (float) $reading->usage_kwh,
                'amount' => (float) $reading->amount,
                'rate_applied' => $elecRate,
                'date' => Carbon::parse($reading->date)->format('Y-m-d'),
            ],
            'bill_updated' => $billUpdated,
        ], 201);
    }

    /**
     * Show a single utility reading.
     */
    public function show(int $id): JsonResponse
    {
        $reading = UtilityReading::with(['tenant.property'])->find($id);

        if (! $reading) {
            return response()->json(['message' => 'Reading not found.'], 404);
        }

        return response()->json([
            'data' => [
                'id' => (string) $reading->id,
                'tenant_id' => (string) $reading->tenant_id,
                'tenant_name' => $reading->tenant?->name,
                'room' => $reading->tenant?->room,
                'property_name' => $reading->tenant?->property?->name,
                'prev_reading' => (float) $reading->prev_reading,
                'curr_reading' => (float) $reading->curr_reading,
                'usage_kwh' => (float) $reading->usage_kwh,
                'amount' => (float) $reading->amount,
                'date' => $reading->date ? Carbon::parse($reading->date)->format('Y-m-d') : null,
            ],
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

        $reading = UtilityReading::find($id);

        if (! $reading) {
            return response()->json(['message' => 'Reading not found.'], 404);
        }

        // Reverse bill adjustment if a bill was updated by this reading
        $readingDate = Carbon::parse($reading->date);
        $monthStart = $readingDate->copy()->startOfMonth()->format('Y-m-d');
        $monthEnd = $readingDate->copy()->endOfMonth()->format('Y-m-d');

        $bill = Bill::where('tenant_id', $reading->tenant_id)
            ->whereBetween('date', [$monthStart, $monthEnd])
            ->first();

        if ($bill) {
            $oldElec = (float) $bill->electricity;
            $readingAmount = (float) $reading->amount;

            // Only reverse if the bill's electricity matches this reading
            if (abs($oldElec - $readingAmount) < 0.01) {
                $bill->electricity = 0;
                $bill->elec_usage = 0;
                $bill->total_amount = (float) $bill->rent + (float) $bill->water + (float) $bill->late_fee;
                $bill->save();

                // Reverse tenant balance adjustment
                $tenant = Tenant::find($reading->tenant_id);
                if ($tenant) {
                    $tenant->decrement('balance', $readingAmount);
                }
            }
        }

        $reading->delete();

        return response()->json([
            'message' => 'Utility reading deleted successfully.',
        ]);
    }
}
