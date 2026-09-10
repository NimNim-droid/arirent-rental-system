<?php

namespace App\Http\Controllers;

use App\Models\Bill;
use App\Models\MaintenanceTicket;
use App\Models\Property;
use App\Models\Room;
use App\Models\Setting;
use App\Models\Tenant;
use App\Models\UtilityReading;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class DashboardController extends Controller
{
    /**
     * Admin dashboard aggregated statistics.
     */
    public function stats(Request $request): JsonResponse
    {
        $propertyId = $request->query('property_id');

        // Total revenue from all approved/paid bills
        $billsQuery = Bill::where('status', 'paid');
        if ($propertyId) {
            $billsQuery->whereHas('tenant', fn ($q) => $q->where('property_id', $propertyId));
        }
        $totalRevenue = (float) $billsQuery->sum('total_amount');

        // Rooms & occupancy
        $roomsQuery = Room::query();
        if ($propertyId) {
            $roomsQuery->where('property_id', $propertyId);
        }
        $totalRooms = $roomsQuery->count();
        $occupiedRooms = (clone $roomsQuery)->where('status', 'occupied')->count();
        $occupancyRate = $totalRooms > 0 ? round(($occupiedRooms / $totalRooms) * 100, 1) : 0;

        // Pending applications
        $pendingQuery = Tenant::where('status', 'pending_approval');
        if ($propertyId) {
            $pendingQuery->where('property_id', $propertyId);
        }
        $pendingApplications = $pendingQuery->count();

        // Pending payments awaiting verification
        $pendingPaymentsQuery = Bill::where('status', 'pending_verification');
        if ($propertyId) {
            $pendingPaymentsQuery->whereHas('tenant', fn ($q) => $q->where('property_id', $propertyId));
        }
        $pendingPayments = $pendingPaymentsQuery->count();

        // Recent maintenance tickets
        $ticketsQuery = MaintenanceTicket::with('tenant')->latest()->take(5);
        if ($propertyId) {
            $ticketsQuery->where('property_id', $propertyId);
        }
        $recentTickets = $ticketsQuery->get()->map(fn ($t) => [
            'id' => (string) $t->id,
            'tenant_id' => (string) $t->tenant_id,
            'tenant_name' => $t->tenant?->name,
            'property_id' => (string) $t->property_id,
            'room' => $t->room,
            'type' => $t->type,
            'description' => $t->description,
            'priority' => $t->priority,
            'status' => $t->status,
            'technician_name' => $t->technician_name,
            'admin_notes' => $t->admin_notes,
            'date' => $t->created_at ? $t->created_at->format('Y-m-d') : null,
        ]);

        return response()->json([
            'data' => [
                'total_revenue' => $totalRevenue,
                'occupancy_rate' => $occupancyRate,
                'occupied_rooms' => $occupiedRooms,
                'total_rooms' => $totalRooms,
                'pending_applications' => $pendingApplications,
                'pending_payments' => $pendingPayments,
                'recent_maintenance' => $recentTickets,
            ],
        ]);
    }

    /**
     * Tenant dashboard metrics and active lease summary.
     */
    public function tenantDashboard(Request $request): JsonResponse
    {
        $user = $request->user();
        $tenant = Tenant::where('user_id', $user->id)
            ->orWhere('email', $user->email)
            ->with('property')
            ->first();

        if (! $tenant) {
            return response()->json(['message' => 'Tenant profile not found.'], 404);
        }

        // Room and rent
        $room = Room::where('property_id', $tenant->property_id)
            ->where('room_number', $tenant->room)
            ->first();

        // Latest unpaid bill for due date
        $latestBill = Bill::where('tenant_id', $tenant->id)
            ->where('status', 'unpaid')
            ->orderBy('due_date', 'asc')
            ->first();

        // Latest utility reading
        $latestReading = UtilityReading::where('tenant_id', $tenant->id)
            ->latest('date')
            ->first();

        // System settings
        $settings = Setting::first();
        $elecRate = $settings ? (float) $settings->elec_rate : 12.50;

        // Recent maintenance
        $recentTickets = MaintenanceTicket::where('tenant_id', $tenant->id)
            ->latest()
            ->take(3)
            ->get()
            ->map(fn ($t) => [
                'id' => (string) $t->id,
                'type' => $t->type,
                'description' => $t->description,
                'priority' => $t->priority,
                'status' => $t->status,
                'date' => $t->created_at ? $t->created_at->format('Y-m-d') : null,
            ]);

        return response()->json([
            'data' => [
                'outstanding_balance' => (float) $tenant->balance,
                'due_date' => $latestBill?->due_date ? Carbon::parse($latestBill->due_date)->format('Y-m-d') : null,
                'unit' => [
                    'room' => $tenant->room,
                    'rent' => $room ? (float) $room->rent : 5000.00,
                    'water_rate' => (float) $tenant->water_rate,
                    'lease_end' => $tenant->lease_end ? Carbon::parse($tenant->lease_end)->format('Y-m-d') : null,
                    'property_name' => $tenant->property?->name ?? 'AriRent Property',
                    'city' => $tenant->property?->city,
                    'address' => $tenant->property?->address,
                ],
                'electricity' => [
                    'usage_kwh' => $latestReading ? (float) $latestReading->usage_kwh : 0.00,
                    'latest_reading' => $latestReading ? (float) $latestReading->curr_reading : 0.00,
                    'estimated_charge' => $latestReading ? (float) $latestReading->amount : 0.00,
                    'elec_rate' => $elecRate,
                ],
                'recent_maintenance' => $recentTickets,
                'settings' => $settings ? [
                    'elec_rate' => (float) $settings->elec_rate,
                    'water_rate' => (float) $settings->water_rate,
                    'gcash_name' => $settings->gcash_name,
                    'gcash_number' => $settings->gcash_number,
                    'gcash_qr_path' => $settings->gcash_qr_path,
                ] : null,
            ],
        ]);
    }
}
