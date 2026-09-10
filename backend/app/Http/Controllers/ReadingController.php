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
        $query = UtilityReading::with(['tenant.property'])->latest('date');

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

        $readings = $query->get();

        $data = $readings->map(function ($r) {
            return [
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
        });

        return response()->json([
            'data' => $data,
        ]);
    }

    /**
     * Store a new meter reading and auto-calculate usage and cost.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tenant_id' => 'required|exists:tenants,id',
            'prev_reading' => 'required|numeric|min:0',
            'curr_reading' => 'required|numeric|gte:prev_reading',
            'date' => 'required|date',
        ]);

        $prev = (float) $validated['prev_reading'];
        $curr = (float) $validated['curr_reading'];
        $usage = max(0, round($curr - $prev, 2));

        // Get electricity rate from settings
        $settings = Setting::first();
        $elecRate = $settings ? (float) $settings->elec_rate : 12.50;
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
        $reading = UtilityReading::find($id);

        if (! $reading) {
            return response()->json(['message' => 'Reading not found.'], 404);
        }

        $reading->delete();

        return response()->json([
            'message' => 'Utility reading deleted successfully.',
        ]);
    }
}
