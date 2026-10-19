<?php

namespace App\Services;

use App\Models\Bill;
use App\Models\UtilityReading;
use App\Repositories\Contracts\BillRepositoryInterface;
use App\Repositories\Contracts\ReadingRepositoryInterface;
use App\Repositories\Contracts\RoomRepositoryInterface;
use App\Repositories\Contracts\SettingsRepositoryInterface;
use App\Repositories\Contracts\TenantRepositoryInterface;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class BillService
{
    public function __construct(
        protected BillRepositoryInterface $billRepo,
        protected TenantRepositoryInterface $tenantRepo,
        protected RoomRepositoryInterface $roomRepo,
        protected ReadingRepositoryInterface $readingRepo,
        protected SettingsRepositoryInterface $settingsRepo
    ) {}

    public function createBill(array $data, ?float $prevReading = null, ?float $currReading = null): Bill
    {
        return DB::transaction(function () use ($data, $prevReading, $currReading) {
            $rent = (float) $data['rent'];
            $elec = (float) ($data['electricity'] ?? 0);
            $elecUsage = (float) ($data['elec_usage'] ?? 0);
            $water = (float) ($data['water'] ?? 0);
            $lateFee = (float) ($data['late_fee'] ?? 0);
            $total = $rent + $elec + $water + $lateFee;

            $bill = $this->billRepo->create([
                'tenant_id' => $data['tenant_id'],
                'rent' => $rent,
                'electricity' => $elec,
                'elec_usage' => $elecUsage,
                'water' => $water,
                'late_fee' => $lateFee,
                'total_amount' => $total,
                'date' => $data['date'],
                'due_date' => $data['due_date'],
                'status' => 'unpaid',
                'notes' => $data['notes'] ?? null,
            ]);

            if ($elecUsage > 0 || $elec > 0) {
                $prev = (float) ($prevReading ?? 0);
                $curr = (float) ($currReading ?? ($prev + $elecUsage));

                $this->readingRepo->create([
                    'tenant_id' => $data['tenant_id'],
                    'prev_reading' => $prev,
                    'curr_reading' => $curr,
                    'usage_kwh' => $elecUsage,
                    'amount' => $elec,
                    'date' => $data['date'],
                ]);
            }

            $tenant = $this->tenantRepo->find((int) $data['tenant_id']);
            if ($tenant) {
                $tenant->increment('balance', $total);
            }

            Cache::forget('admin_stats_all');
            Cache::forget("tenant_dashboard_{$data['tenant_id']}");

            return $bill;
        });
    }

    /**
     * Batch-generate monthly bills for all active tenants.
     */
    public function generateMonthlyBills(?string $customDate = null): array
    {
        $billingDate = $customDate ? Carbon::parse($customDate) : now();
        $monthStart = $billingDate->copy()->startOfMonth()->format('Y-m-d');
        $monthEnd = $billingDate->copy()->endOfMonth()->format('Y-m-d');

        $activeTenants = $this->tenantRepo->getActiveTenants();
        if ($activeTenants->isEmpty()) {
            return [
                'message' => 'No active tenants to bill.',
                'generated' => 0,
                'skipped' => 0,
            ];
        }

        $tenantIds = $activeTenants->pluck('id')->all();
        $propertyIds = $activeTenants->pluck('property_id')->unique()->all();

        $existingBilledTenantIds = $this->billRepo->getBilledTenantIdsForMonth($tenantIds, $monthStart, $monthEnd);
        $rooms = $this->roomRepo->getRoomsByPropertyIds($propertyIds);
        $readings = $this->readingRepo->getLatestReadingsForTenants($tenantIds);

        $today = now()->format('Y-m-d');
        $overdueTenantIds = $this->billRepo->getOverdueTenantIds($today);

        $defaultWaterRate = (float) $this->settingsRepo->getGlobal()->water_rate;

        $generated = 0;
        $skipped = 0;

        DB::transaction(function () use (
            $activeTenants,
            $existingBilledTenantIds,
            $rooms,
            $readings,
            $overdueTenantIds,
            $defaultWaterRate,
            $billingDate,
            &$generated,
            &$skipped
        ) {
            $billsToInsert = [];
            $balanceIncrements = [];
            $now = now();
            $formattedBillingDate = $billingDate->format('Y-m-d');

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

                $moveInDate = $tenant->move_in_date
                    ? Carbon::parse($tenant->move_in_date)
                    : ($tenant->created_at ? Carbon::parse($tenant->created_at) : $billingDate);

                if ($tenant->advance_paid >= $rent && $moveInDate->isSameMonth($billingDate)) {
                    $skipped++;
                    continue;
                }

                $billingDay = $tenant->getBillingDay();
                $daysInMonth = $billingDate->daysInMonth;
                $day = min($billingDay, $daysInMonth);
                $tenantDueDate = Carbon::create($billingDate->year, $billingDate->month, $day);

                $coverageEnd = $tenantDueDate->copy()->addMonth()->subDay();
                $coverageNote = "Monthly rent (Coverage: {$tenantDueDate->format('M d, Y')} - {$coverageEnd->format('M d, Y')})";

                $water = (float) $tenant->water_rate > 0 ? (float) $tenant->water_rate : $defaultWaterRate;

                $latestReading = $readings->get($tenant->id);
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
                $this->billRepo->insertBatch($billsToInsert);

                foreach ($balanceIncrements as $tId => $inc) {
                    $this->tenantRepo->incrementBalance($tId, $inc);
                }
            }
        });

        Cache::forget('admin_stats_all');
        foreach ($activeTenants as $tenant) {
            Cache::forget("tenant_dashboard_{$tenant->id}");
        }

        return [
            'message' => "Bills generated: {$generated}, skipped (already billed): {$skipped}.",
            'generated' => $generated,
            'skipped' => $skipped,
        ];
    }

    public function updateBill(int $id, array $data): Bill
    {
        $bill = $this->billRepo->find($id);
        if (! $bill) {
            throw new ModelNotFoundException('Bill not found.');
        }

        $financialFields = ['rent', 'electricity', 'elec_usage', 'water', 'late_fee'];
        $hasFinancialChanges = false;
        foreach ($financialFields as $field) {
            if (isset($data[$field])) {
                $hasFinancialChanges = true;
                break;
            }
        }

        if ($bill->status === 'paid' && $hasFinancialChanges) {
            throw new InvalidArgumentException('Cannot modify financial amounts on an invoice that has already been paid.');
        }

        $oldTotal = (float) $bill->total_amount;
        $oldStatus = $bill->status;
        $newStatus = $data['status'] ?? $oldStatus;

        if ($hasFinancialChanges) {
            $newRent = isset($data['rent']) ? (float) $data['rent'] : (float) $bill->rent;
            $newElec = isset($data['electricity']) ? (float) $data['electricity'] : (float) $bill->electricity;
            $newWater = isset($data['water']) ? (float) $data['water'] : (float) $bill->water;
            $newLateFee = isset($data['late_fee']) ? (float) $data['late_fee'] : (float) $bill->late_fee;
            $newTotal = $newRent + $newElec + $newWater + $newLateFee;
            $data['total_amount'] = $newTotal;
        }

        return DB::transaction(function () use ($id, $data, $bill, $oldTotal, $oldStatus, $newStatus, $hasFinancialChanges) {
            $bill = $this->billRepo->update($id, $data);

            // Reconcile tenant balance accurately with non-negative clamping
            $tenant = $this->tenantRepo->find((int) $bill->tenant_id);
            if ($tenant) {
                if ($newStatus === 'voided' && $oldStatus !== 'voided') {
                    if (in_array($oldStatus, ['unpaid', 'pending_verification'])) {
                        $tenant->decrement('balance', min((float) $tenant->balance, $oldTotal));
                    }
                } elseif ($oldStatus === 'voided' && $newStatus !== 'voided') {
                    $tenant->increment('balance', (float) $bill->total_amount);
                } elseif ($newStatus === 'paid' && $oldStatus === 'unpaid') {
                    $tenant->decrement('balance', min((float) $tenant->balance, (float) $bill->total_amount));
                } elseif ($newStatus === 'unpaid' && $oldStatus === 'paid') {
                    $tenant->increment('balance', (float) $bill->total_amount);
                } elseif (in_array($bill->status, ['unpaid', 'pending_verification']) && $hasFinancialChanges) {
                    $diff = (float) $bill->total_amount - $oldTotal;
                    if ($diff > 0) {
                        $tenant->increment('balance', $diff);
                    } elseif ($diff < 0) {
                        $tenant->decrement('balance', min((float) $tenant->balance, abs($diff)));
                    }
                }
            }

            Cache::forget('admin_stats_all');
            Cache::forget("tenant_dashboard_{$bill->tenant_id}");

            return $bill;
        });
    }

    public function deleteBill(int $id): bool
    {
        $bill = $this->billRepo->find($id);
        if (! $bill) {
            throw new ModelNotFoundException('Bill not found.');
        }

        return DB::transaction(function () use ($id, $bill) {
            if (in_array($bill->status, ['unpaid', 'pending_verification'])) {
                $tenant = $this->tenantRepo->find((int) $bill->tenant_id);
                if ($tenant) {
                    $tenant->decrement('balance', min((float) $tenant->balance, (float) $bill->total_amount));
                }
            }

            $tenantId = $bill->tenant_id;
            $deleted = $this->billRepo->delete($id);

            Cache::forget('admin_stats_all');
            Cache::forget("tenant_dashboard_{$tenantId}");

            return $deleted;
        });
    }
}
