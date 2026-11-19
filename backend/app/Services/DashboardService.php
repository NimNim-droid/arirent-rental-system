<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\Contracts\BillRepositoryInterface;
use App\Repositories\Contracts\MaintenanceRepositoryInterface;
use App\Repositories\Contracts\ReadingRepositoryInterface;
use App\Repositories\Contracts\RoomRepositoryInterface;
use App\Repositories\Contracts\SettingsRepositoryInterface;
use App\Repositories\Contracts\TenantRepositoryInterface;
use App\Support\PrivateFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;

class DashboardService
{
    public function __construct(
        protected TenantRepositoryInterface $tenantRepo,
        protected SettingsRepositoryInterface $settingsRepo,
        protected BillRepositoryInterface $billRepo,
        protected RoomRepositoryInterface $roomRepo,
        protected ReadingRepositoryInterface $readingRepo,
        protected MaintenanceRepositoryInterface $maintenanceRepo
    ) {}

    /**
     * Admin dashboard aggregated statistics.
     */
    public function getAdminStats(?int $propertyId = null): array
    {
        $cacheKey = 'admin_stats_' . ($propertyId ?: 'all');

        return Cache::remember($cacheKey, 15, function () use ($propertyId) {
            $totalRevenue = $this->billRepo->sumPaidRevenue($propertyId);

            $roomStats = $this->roomRepo->getOccupancyStats($propertyId);
            $totalRooms = $roomStats['total'];
            $occupiedRooms = $roomStats['occupied'];
            $occupancyRate = $totalRooms > 0 ? round(($occupiedRooms / $totalRooms) * 100, 1) : 0;

            $pendingApplications = $this->tenantRepo->countPendingApproval($propertyId);
            $pendingPayments = $this->billRepo->countPendingVerification($propertyId);

            $recentTickets = $this->maintenanceRepo->getRecent($propertyId, 5)->map(fn ($t) => [
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

            return [
                'total_revenue' => $totalRevenue,
                'occupancy_rate' => $occupancyRate,
                'occupied_rooms' => $occupiedRooms,
                'vacant_rooms' => $roomStats['vacant'] ?? max(0, $totalRooms - $occupiedRooms),
                'reserved_rooms' => $roomStats['reserved'] ?? 0,
                'total_rooms' => $totalRooms,
                'pending_applications' => $pendingApplications,
                'pending_payments' => $pendingPayments,
                'recent_maintenance' => $recentTickets,
            ];
        });
    }

    /**
     * Tenant dashboard metrics and active lease summary.
     */
    public function getTenantDashboard(User $user): ?array
    {
        $tenant = $this->tenantRepo->findByUserIdOrEmail($user->id, $user->email);

        if (! $tenant) {
            return null;
        }

        $tenant->loadMissing('property:id,name,city,address');

        $cacheKey = "tenant_dashboard_{$tenant->id}";

        return Cache::remember($cacheKey, 30, function () use ($tenant) {
            $room = $this->roomRepo->findByPropertyAndNumber((int) $tenant->property_id, (string) $tenant->room);
            $latestBill = $this->billRepo->findEarliestOwedForTenant((int) $tenant->id);

            // If the room record is missing, fall back to the rent actually
            // charged on the tenant's latest invoice instead of inventing one.
            $billedRent = $room
                ? (float) $room->rent
                : $this->billRepo->getLatestNonVoidedRentForTenant((int) $tenant->id);

            $latestReading = $this->readingRepo->getLatestReadingForTenant((int) $tenant->id);
            $settings = $this->settingsRepo->getGlobal();
            $elecRate = (float) $settings->elec_rate;

            $recentTickets = $this->maintenanceRepo->getRecentForTenant((int) $tenant->id, 3)->map(fn ($t) => [
                'id' => (string) $t->id,
                'type' => $t->type,
                'description' => $t->description,
                'priority' => $t->priority,
                'status' => $t->status,
                'date' => $t->created_at ? $t->created_at->format('Y-m-d') : null,
            ]);

            return [
                'outstanding_balance' => (float) $tenant->balance,
                'due_date' => $latestBill?->due_date ? Carbon::parse($latestBill->due_date)->format('Y-m-d') : null,
                'unit' => [
                    'room' => $tenant->room,
                    'rent' => $billedRent,
                    'water_rate' => (float) $tenant->water_rate,
                    'lease_end' => $tenant->lease_end ? Carbon::parse($tenant->lease_end)->format('Y-m-d') : null,
                    'property_name' => $tenant->property?->name ?? 'AriRent Property',
                    'city' => $tenant->property?->city,
                    'address' => $tenant->property?->address,
                ],
                'electricity' => [
                    'usage_kwh' => $latestReading ? (float) $latestReading->usage_kwh : 0.00,
                    'prev_reading' => $latestReading ? (float) $latestReading->prev_reading : 0.00,
                    'latest_reading' => $latestReading ? (float) $latestReading->curr_reading : 0.00,
                    'estimated_charge' => $latestReading ? (float) $latestReading->amount : 0.00,
                    'elec_rate' => $elecRate,
                    'last_reading_date' => $latestReading?->date ? Carbon::parse($latestReading->date)->format('Y-m-d') : null,
                    'meter_photo_url' => $latestReading ? PrivateFile::url($latestReading->meter_photo_url) : null,
                ],
                'recent_maintenance' => $recentTickets,
                'settings' => [
                    'elec_rate' => (float) $settings->elec_rate,
                    'water_rate' => (float) $settings->water_rate,
                    'gcash_name' => $settings->gcash_name,
                    'gcash_number' => $settings->gcash_number,
                    'gcash_qr_path' => $settings->gcash_qr_path,
                ],
            ];
        });
    }
}
