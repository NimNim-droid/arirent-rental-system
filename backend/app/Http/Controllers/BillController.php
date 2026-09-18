<?php

namespace App\Http\Controllers;

use App\Models\Bill;
use App\Models\Room;
use App\Models\Setting;
use App\Models\Tenant;
use App\Models\UtilityReading;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class BillController extends Controller
{
    /**
     * List bills. Tenants only see their own; Admins see all.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Bill::with(['tenant:id,name,room,property_id', 'tenant.property:id,name'])->latest('date');

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

            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }
        }

        $formatBill = fn ($b) => [
            'id' => (string) $b->id,
            'tenant_id' => (string) $b->tenant_id,
            'tenant_name' => $b->tenant?->name,
            'room' => $b->tenant?->room,
            'property_name' => $b->tenant?->property?->name,
            'rent' => (float) $b->rent,
            'electricity' => (float) $b->electricity,
            'elec_usage' => (float) $b->elec_usage,
            'water' => (float) $b->water,
            'late_fee' => (float) $b->late_fee,
            'total_amount' => (float) $b->total_amount,
            'date' => $b->date ? Carbon::parse($b->date)->format('Y-m-d') : null,
            'due_date' => $b->due_date ? Carbon::parse($b->due_date)->format('Y-m-d') : null,
            'status' => $b->status,
            'gcash_ref' => $b->gcash_ref,
            'receipt_url' => $b->receipt_url,
            'notes' => $b->notes,
            'payment_date' => $b->payment_date ? Carbon::parse($b->payment_date)->format('Y-m-d H:i:s') : null,
            'approved_date' => $b->approved_date ? Carbon::parse($b->approved_date)->format('Y-m-d H:i:s') : null,
            'reject_reason' => $b->reject_reason,
        ];

        // Always paginate — default 50, max 250
        $perPage = min((int) $request->input('per_page', 50), 250);
        $paginated = $query->paginate($perPage);

        return response()->json([
            'data' => $paginated->getCollection()->map($formatBill),
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
     * Show a single bill.
     */
    public function show(int $id): JsonResponse
    {
        $user = request()->user();
        $bill = Bill::with(['tenant:id,name,room,property_id', 'tenant.property:id,name'])->find($id);

        if (! $bill) {
            return response()->json(['message' => 'Bill not found.'], 404);
        }

        // Tenants may only view their own bills (IDOR protection)
        if ($user && $user->role === 'tenant') {
            $tenant = Tenant::where('user_id', $user->id)
                ->orWhere('email', $user->email)
                ->first();

            if (! $tenant || $bill->tenant_id !== $tenant->id) {
                return response()->json(['message' => 'Unauthorized to view this bill.'], 403);
            }
        }

        return response()->json([
            'data' => [
                'id' => (string) $bill->id,
                'tenant_id' => (string) $bill->tenant_id,
                'tenant_name' => $bill->tenant?->name,
                'room' => $bill->tenant?->room,
                'property_name' => $bill->tenant?->property?->name,
                'rent' => (float) $bill->rent,
                'electricity' => (float) $bill->electricity,
                'elec_usage' => (float) $bill->elec_usage,
                'water' => (float) $bill->water,
                'late_fee' => (float) $bill->late_fee,
                'total_amount' => (float) $bill->total_amount,
                'date' => $bill->date ? Carbon::parse($bill->date)->format('Y-m-d') : null,
                'due_date' => $bill->due_date ? Carbon::parse($bill->due_date)->format('Y-m-d') : null,
                'status' => $bill->status,
                'gcash_ref' => $bill->gcash_ref,
                'receipt_url' => $bill->receipt_url,
                'notes' => $bill->notes,
                'payment_date' => $bill->payment_date ? Carbon::parse($bill->payment_date)->format('Y-m-d H:i:s') : null,
                'approved_date' => $bill->approved_date ? Carbon::parse($bill->approved_date)->format('Y-m-d H:i:s') : null,
                'reject_reason' => $bill->reject_reason,
            ],
        ]);
    }

    /**
     * Create a single bill manually. Admin only.
     */
    public function store(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }
        $validated = $request->validate([
            'tenant_id' => 'required|exists:tenants,id',
            'rent' => 'required|numeric|min:0',
            'electricity' => 'nullable|numeric|min:0',
            'elec_usage' => 'nullable|numeric|min:0',
            'water' => 'nullable|numeric|min:0',
            'late_fee' => 'nullable|numeric|min:0',
            'date' => 'required|date',
            'due_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        $rent = (float) $validated['rent'];
        $elec = (float) ($validated['electricity'] ?? 0);
        $elecUsage = (float) ($validated['elec_usage'] ?? 0);
        $water = (float) ($validated['water'] ?? 0);
        $lateFee = (float) ($validated['late_fee'] ?? 0);
        $total = $rent + $elec + $water + $lateFee;

        $bill = Bill::create([
            'tenant_id' => $validated['tenant_id'],
            'rent' => $rent,
            'electricity' => $elec,
            'elec_usage' => $elecUsage,
            'water' => $water,
            'late_fee' => $lateFee,
            'total_amount' => $total,
            'date' => $validated['date'],
            'due_date' => $validated['due_date'],
            'status' => 'unpaid',
            'notes' => $validated['notes'] ?? null,
        ]);

        // Record utility reading history if electricity usage was entered
        if ($elecUsage > 0 || $elec > 0) {
            $prevReading = (float) ($request->input('prev_reading') ?? 0);
            $currReading = (float) ($request->input('curr_reading') ?? ($prevReading + $elecUsage));

            UtilityReading::create([
                'tenant_id' => $validated['tenant_id'],
                'prev_reading' => $prevReading,
                'curr_reading' => $currReading,
                'usage_kwh' => $elecUsage,
                'amount' => $elec,
                'date' => $validated['date'],
            ]);
        }

        // Reconcile tenant balance
        $tenant = Tenant::find($validated['tenant_id']);
        if ($tenant) {
            $tenant->increment('balance', $total);
        }

        \Illuminate\Support\Facades\Cache::forget('admin_stats_all');

        return response()->json([
            'message' => 'Bill created successfully.',
            'bill' => $bill,
        ], 201);
    }

    /**
     * Batch generate monthly invoices for all active tenants. Admin only.
     */
    public function generate(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $request->validate([
            'date' => 'nullable|date',
        ]);

        $billingDate = $request->date ? Carbon::parse($request->date) : now();
        $monthStart = $billingDate->copy()->startOfMonth()->format('Y-m-d');
        $monthEnd = $billingDate->copy()->endOfMonth()->format('Y-m-d');

        $activeTenants = Tenant::where('status', 'active')->get();
        if ($activeTenants->isEmpty()) {
            return response()->json([
                'message' => 'No active tenants to bill.',
                'generated' => 0,
                'skipped' => 0,
            ]);
        }

        $tenantIds = $activeTenants->pluck('id')->all();
        $propertyIds = $activeTenants->pluck('property_id')->unique()->all();

        // 1. Bulk pre-fetch existing active bills for this month (exclude voided bills)
        $existingBilledTenantIds = Bill::whereIn('tenant_id', $tenantIds)
            ->where('status', '!=', 'voided')
            ->whereBetween('date', [$monthStart, $monthEnd])
            ->pluck('tenant_id')
            ->flip();

        // 2. Bulk pre-fetch room rents for assigned properties in 1 query
        $rooms = Room::whereIn('property_id', $propertyIds)
            ->get(['property_id', 'room_number', 'rent'])
            ->keyBy(fn ($r) => "{$r->property_id}-{$r->room_number}");

        // 3. Bulk pre-fetch utility readings for the month in 1 query
        $readings = UtilityReading::whereIn('tenant_id', $tenantIds)
            ->whereBetween('date', [$monthStart, $monthEnd])
            ->orderBy('date', 'desc')
            ->get(['tenant_id', 'amount', 'usage_kwh', 'date'])
            ->groupBy('tenant_id');

        // 4. Bulk pre-fetch overdue unpaid bills in 1 query
        $overdueTenantIds = Bill::whereIn('tenant_id', $tenantIds)
            ->where('status', 'unpaid')
            ->where('due_date', '<', now()->subDays(30))
            ->pluck('tenant_id')
            ->flip();

        // Cached settings
        $settings = Setting::getGlobal();
        $defaultWaterRate = (float) $settings->water_rate;

        $generated = 0;
        $skipped = 0;
        $now = now();
        $formattedBillingDate = $billingDate->format('Y-m-d');

        \Illuminate\Support\Facades\DB::transaction(function () use (
            $activeTenants,
            $existingBilledTenantIds,
            $rooms,
            $readings,
            $overdueTenantIds,
            $defaultWaterRate,
            $formattedBillingDate,
            $billingDate,
            $now,
            &$generated,
            &$skipped
        ) {
            $billsToInsert = [];
            $balanceIncrements = [];

            foreach ($activeTenants as $tenant) {
                if (isset($existingBilledTenantIds[$tenant->id])) {
                    $skipped++;
                    continue;
                }

                $roomKey = "{$tenant->property_id}-{$tenant->room}";
                $room = $rooms->get($roomKey);
                if (! $room) {
                    $skipped++;
                    continue;
                }
                $rent = (float) $room->rent;

                // Move-in & Anniversary Date calculation
                $moveInDate = $tenant->move_in_date
                    ? Carbon::parse($tenant->move_in_date)
                    : ($tenant->created_at ? Carbon::parse($tenant->created_at) : $billingDate);

                // If tenant moved in during this month and has advance payment covering this month,
                // skip billing rent for this initial month
                if ($tenant->advance_paid >= $rent && $moveInDate->isSameMonth($billingDate)) {
                    $skipped++;
                    continue;
                }

                // Calculate due date on tenant's billing anniversary day
                $billingDay = $tenant->getBillingDay();
                $daysInMonth = $billingDate->daysInMonth;
                $day = min($billingDay, $daysInMonth);
                $tenantDueDate = Carbon::create($billingDate->year, $billingDate->month, $day);

                // Coverage period: 1 month starting from the due date
                $coverageEnd = $tenantDueDate->copy()->addMonth()->subDay();
                $coverageNote = "Monthly rent (Coverage: {$tenantDueDate->format('M d, Y')} - {$coverageEnd->format('M d, Y')})";

                $water = (float) $tenant->water_rate > 0 ? (float) $tenant->water_rate : $defaultWaterRate;

                $tenantReadings = $readings->get($tenant->id);
                $latestReading = $tenantReadings ? $tenantReadings->first() : null;
                $elec = $latestReading ? (float) $latestReading->amount : 0.00;
                $elecUsage = $latestReading ? (float) $latestReading->usage_kwh : 0.00;

                $lateFee = isset($overdueTenantIds[$tenant->id]) ? 250.00 : 0.00;
                $total = $rent + $elec + $water + $lateFee;

                $billsToInsert[] = [
                    'tenant_id' => $tenant->id,
                    'rent' => $rent,
                    'electricity' => $elec,
                    'elec_usage' => $elecUsage,
                    'water' => $water,
                    'late_fee' => $lateFee,
                    'total_amount' => $total,
                    'date' => $formattedBillingDate,
                    'due_date' => $tenantDueDate->format('Y-m-d'),
                    'status' => 'unpaid',
                    'notes' => $coverageNote,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                $balanceIncrements[$tenant->id] = ($balanceIncrements[$tenant->id] ?? 0) + $total;
                $generated++;
            }

            if (! empty($billsToInsert)) {
                Bill::insert($billsToInsert);

                foreach ($balanceIncrements as $tId => $inc) {
                    Tenant::where('id', $tId)->increment('balance', $inc);
                }
            }
        });

        // Invalidate stats cache so dashboard reflects newly generated invoices
        \Illuminate\Support\Facades\Cache::forget('admin_stats_all');

        // Invalidate affected tenant dashboard caches
        foreach ($activeTenants as $tenant) {
            \Illuminate\Support\Facades\Cache::forget("tenant_dashboard_{$tenant->id}");
        }

        return response()->json([
            'message' => "Bills generated: {$generated}, skipped (already billed): {$skipped}.",
            'generated' => $generated,
            'skipped' => $skipped,
        ]);
    }

    /**
     * Update a bill. Admin only.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $bill = Bill::find($id);

        if (! $bill) {
            return response()->json(['message' => 'Bill not found.'], 404);
        }

        $validated = $request->validate([
            'rent' => 'nullable|numeric|min:0',
            'electricity' => 'nullable|numeric|min:0',
            'elec_usage' => 'nullable|numeric|min:0',
            'water' => 'nullable|numeric|min:0',
            'late_fee' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:unpaid,pending_verification,paid,voided',
            'notes' => 'nullable|string',
        ]);

        $financialFields = ['rent', 'electricity', 'elec_usage', 'water', 'late_fee'];
        $hasFinancialChanges = false;
        foreach ($financialFields as $field) {
            if (isset($validated[$field])) {
                $hasFinancialChanges = true;
                break;
            }
        }

        // Paid invoices are immutable regarding financial breakdown
        if ($bill->status === 'paid' && $hasFinancialChanges) {
            return response()->json([
                'message' => 'Cannot modify financial amounts on an invoice that has already been paid.',
            ], 422);
        }

        $oldTotal = (float) $bill->total_amount;
        $oldStatus = $bill->status;
        $newStatus = $validated['status'] ?? $oldStatus;

        if (isset($validated['rent'])) $bill->rent = $validated['rent'];
        if (isset($validated['electricity'])) $bill->electricity = $validated['electricity'];
        if (isset($validated['elec_usage'])) $bill->elec_usage = $validated['elec_usage'];
        if (isset($validated['water'])) $bill->water = $validated['water'];
        if (isset($validated['late_fee'])) $bill->late_fee = $validated['late_fee'];
        if (isset($validated['notes'])) $bill->notes = $validated['notes'];
        if (isset($validated['status'])) $bill->status = $validated['status'];

        $bill->total_amount = (float) $bill->rent + (float) $bill->electricity + (float) $bill->water + (float) $bill->late_fee;
        $bill->save();

        // Reconcile tenant balance accurately
        $tenant = Tenant::find($bill->tenant_id);
        if ($tenant) {
            if ($newStatus === 'voided' && $oldStatus !== 'voided') {
                // Bill voided: relieve tenant of the debt if it was unsettled
                if (in_array($oldStatus, ['unpaid', 'pending_verification'])) {
                    $tenant->decrement('balance', min((float) $tenant->balance, $oldTotal));
                }
            } elseif ($oldStatus === 'voided' && $newStatus !== 'voided') {
                // Bill restored from voided: re-apply debt to tenant balance
                $tenant->increment('balance', (float) $bill->total_amount);
            } elseif (in_array($bill->status, ['unpaid', 'pending_verification'])) {
                // Adjust balance by difference if amounts changed on an active unpaid bill
                $totalDiff = (float) $bill->total_amount - $oldTotal;
                if ($totalDiff != 0) {
                    $tenant->increment('balance', $totalDiff);
                }
            }
        }

        // Invalidate stats and tenant caches
        \Illuminate\Support\Facades\Cache::forget('admin_stats_all');
        \Illuminate\Support\Facades\Cache::forget("tenant_dashboard_{$bill->tenant_id}");

        return response()->json([
            'message' => 'Bill updated successfully.',
            'bill' => $bill,
        ]);
    }

    /**
     * Tenant submits payment (GCash Reference Number & Receipt).
     */
    public function pay(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $bill = Bill::find($id);

        if (! $bill) {
            return response()->json(['message' => 'Bill not found.'], 404);
        }

        // Tenants may only pay their own bills (IDOR protection)
        if ($user->role === 'tenant') {
            $tenant = Tenant::where('user_id', $user->id)
                ->orWhere('email', $user->email)
                ->first();

            if (! $tenant || $bill->tenant_id !== $tenant->id) {
                return response()->json(['message' => 'Unauthorized to pay this bill.'], 403);
            }
        }

        if ($bill->status === 'paid') {
            return response()->json(['message' => 'This invoice has already been paid.'], 422);
        }

        $validated = $request->validate([
            'gcash_ref' => 'required|string|max:100',
            'notes' => 'nullable|string|max:500',
            'receipt' => 'nullable|file|mimes:jpg,jpeg,png,webp,svg,pdf,heic,heif|max:10240',
        ], [
            'gcash_ref.required' => 'The GCash reference number is required.',
            'receipt.mimes' => 'The receipt must be an image (JPG, PNG, WebP, SVG) or PDF file.',
            'receipt.max' => 'The receipt file must not exceed 10MB.',
        ]);

        $receiptUrl = $bill->receipt_url;

        // Handle uploaded receipt image if provided
        if ($request->hasFile('receipt')) {
            // Delete old receipt from storage if it exists
            if ($bill->receipt_url && str_starts_with($bill->receipt_url, '/storage/')) {
                $oldPath = str_replace('/storage/', '', $bill->receipt_url);
                \Illuminate\Support\Facades\Storage::disk('public')->delete($oldPath);
            }
            $path = $request->file('receipt')->store('receipts', 'public');
            $receiptUrl = '/storage/' . $path;
        }

        $bill->update([
            'status' => 'pending_verification',
            'gcash_ref' => $validated['gcash_ref'],
            'receipt_url' => $receiptUrl,
            'notes' => $validated['notes'] ?? $bill->notes,
            'payment_date' => now(),
            'reject_reason' => null,
        ]);

        // Invalidate stats caches so admin dashboard immediately reflects pending payment
        \Illuminate\Support\Facades\Cache::forget('admin_stats_all');
        \Illuminate\Support\Facades\Cache::forget("tenant_dashboard_{$bill->tenant_id}");

        return response()->json([
            'message' => 'Payment submitted successfully. Awaiting landlord verification.',
            'bill' => $bill,
        ]);
    }

    /**
     * Landlord verifies or rejects a submitted payment. Admin only.
     */
    public function verify(Request $request, int $id): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $bill = Bill::find($id);

        if (! $bill) {
            return response()->json(['message' => 'Bill not found.'], 404);
        }

        $validated = $request->validate([
            'approved' => 'required|boolean',
            'reject_reason' => 'nullable|string|max:255',
        ]);

        if ($validated['approved']) {
            // Prevent double-deduction: only approve if bill is pending_verification
            if ($bill->status !== 'pending_verification') {
                return response()->json([
                    'message' => 'This bill cannot be approved. Current status: ' . $bill->status,
                ], 422);
            }

            // Payment approved
            $bill->update([
                'status' => 'paid',
                'approved_date' => now(),
                'reject_reason' => null,
            ]);

            // Deduct from tenant balance
            $tenant = Tenant::find($bill->tenant_id);
            if ($tenant) {
                $tenant->balance = (float) $tenant->balance - (float) $bill->total_amount;
                $tenant->save();
            }

            // Invalidate admin and tenant dashboard caches
            \Illuminate\Support\Facades\Cache::forget('admin_stats_all');
            \Illuminate\Support\Facades\Cache::forget("tenant_dashboard_{$bill->tenant_id}");

            return response()->json([
                'message' => 'Payment approved successfully. Bill marked as paid.',
                'bill' => $bill,
            ]);
        } else {
            // Payment rejected
            $bill->update([
                'status' => 'unpaid',
                'reject_reason' => $validated['reject_reason'] ?? 'Invalid or unverified GCash reference number.',
            ]);

            // Invalidate admin and tenant dashboard caches
            \Illuminate\Support\Facades\Cache::forget('admin_stats_all');
            \Illuminate\Support\Facades\Cache::forget("tenant_dashboard_{$bill->tenant_id}");

            return response()->json([
                'message' => 'Payment rejected. Bill returned to unpaid status.',
                'bill' => $bill,
            ]);
        }
    }

    /**
     * Delete a bill.
     */
    public function destroy(int $id): JsonResponse
    {
        if (request()->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $bill = Bill::find($id);

        if (! $bill) {
            return response()->json(['message' => 'Bill not found.'], 404);
        }

        // Reduce tenant balance for any unsettled bill (unpaid or pending_verification)
        if (in_array($bill->status, ['unpaid', 'pending_verification'])) {
            $tenant = Tenant::find($bill->tenant_id);
            if ($tenant) {
                $tenant->balance = max(0, (float) $tenant->balance - (float) $bill->total_amount);
                $tenant->save();
            }
        }

        $tenantId = $bill->tenant_id;
        $bill->delete();

        // Invalidate admin and tenant dashboard caches
        \Illuminate\Support\Facades\Cache::forget('admin_stats_all');
        \Illuminate\Support\Facades\Cache::forget("tenant_dashboard_{$tenantId}");

        return response()->json([
            'message' => 'Bill deleted successfully.',
        ]);
    }
}
