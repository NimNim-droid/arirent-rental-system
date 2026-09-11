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
        $query = Bill::with(['tenant.property'])->latest('date');

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

        $bills = $query->get();

        $data = $bills->map(function ($b) {
            return [
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
        });

        return response()->json([
            'data' => $data,
        ]);
    }

    /**
     * Show a single bill.
     */
    public function show(int $id): JsonResponse
    {
        $bill = Bill::with(['tenant.property'])->find($id);

        if (! $bill) {
            return response()->json(['message' => 'Bill not found.'], 404);
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

        // Reconcile tenant balance
        $tenant = Tenant::find($validated['tenant_id']);
        if ($tenant) {
            $tenant->increment('balance', $total);
        }

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
        $dueDate = $billingDate->copy()->addDays(15);
        $monthStart = $billingDate->copy()->startOfMonth()->format('Y-m-d');
        $monthEnd = $billingDate->copy()->endOfMonth()->format('Y-m-d');

        $activeTenants = Tenant::where('status', 'active')->get();
        $settings = Setting::first();
        $elecRate = $settings ? (float) $settings->elec_rate : 12.50;
        $defaultWaterRate = $settings ? (float) $settings->water_rate : 500.00;

        $generated = 0;
        $skipped = 0;

        foreach ($activeTenants as $tenant) {
            // Check if already billed this month
            $existingBill = Bill::where('tenant_id', $tenant->id)
                ->whereBetween('date', [$monthStart, $monthEnd])
                ->first();

            if ($existingBill) {
                $skipped++;
                continue;
            }

            // Determine rent from room
            $room = Room::where('property_id', $tenant->property_id)
                ->where('room_number', $tenant->room)
                ->first();
            $rent = $room ? (float) $room->rent : 5000.00;

            // Water rate
            $water = (float) $tenant->water_rate > 0 ? (float) $tenant->water_rate : $defaultWaterRate;

            // Electricity (lookup utility reading logged for this month)
            $reading = UtilityReading::where('tenant_id', $tenant->id)
                ->whereBetween('date', [$monthStart, $monthEnd])
                ->latest('date')
                ->first();
            $elec = $reading ? (float) $reading->amount : 0.00;
            $elecUsage = $reading ? (float) $reading->usage_kwh : 0.00;

            // Late fee (check if any past unpaid bills older than 30 days)
            $hasLate = Bill::where('tenant_id', $tenant->id)
                ->where('status', 'unpaid')
                ->where('due_date', '<', now()->subDays(30))
                ->exists();
            $lateFee = $hasLate ? 250.00 : 0.00;

            $total = $rent + $elec + $water + $lateFee;

            Bill::create([
                'tenant_id' => $tenant->id,
                'rent' => $rent,
                'electricity' => $elec,
                'elec_usage' => $elecUsage,
                'water' => $water,
                'late_fee' => $lateFee,
                'total_amount' => $total,
                'date' => $billingDate->format('Y-m-d'),
                'due_date' => $dueDate->format('Y-m-d'),
                'status' => 'unpaid',
                'notes' => 'Automated monthly rental invoice',
            ]);

            $tenant->increment('balance', $total);
            $generated++;
        }

        return response()->json([
            'message' => "Bills generated: {$generated}, skipped (already billed): {$skipped}.",
            'generated' => $generated,
            'skipped' => $skipped,
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

        $validated = $request->validate([
            'gcash_ref' => 'required|string|max:100',
            'notes' => 'nullable|string|max:500',
            'receipt' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:10240',
        ]);

        $receiptUrl = $bill->receipt_url;

        // Handle uploaded receipt image if provided
        if ($request->hasFile('receipt')) {
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
            // Payment approved
            $bill->update([
                'status' => 'paid',
                'approved_date' => now(),
                'reject_reason' => null,
            ]);

            // Deduct from tenant balance
            $tenant = Tenant::find($bill->tenant_id);
            if ($tenant) {
                $tenant->balance = max(0, (float) $tenant->balance - (float) $bill->total_amount);
                $tenant->save();
            }

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

        $bill->delete();

        return response()->json([
            'message' => 'Bill deleted successfully.',
        ]);
    }
}
