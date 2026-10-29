<?php

namespace App\Services;

use App\Models\Bill;
use App\Models\ExcessCharge;
use App\Models\Payment;
use App\Models\UtilityReading;
use App\Repositories\Contracts\BillRepositoryInterface;
use App\Repositories\Contracts\ReadingRepositoryInterface;
use App\Repositories\Contracts\RoomRepositoryInterface;
use App\Repositories\Contracts\SettingsRepositoryInterface;
use App\Repositories\Contracts\TenantRepositoryInterface;
use App\Support\PrivateFile;
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

            // Tally excess charges if specified
            $excessTotal = 0.00;
            $excessChargeIds = $data['excess_charge_ids'] ?? [];
            $excessCharges = collect();
            if (! empty($excessChargeIds)) {
                $excessCharges = ExcessCharge::whereIn('id', $excessChargeIds)
                    ->where('tenant_id', $data['tenant_id'])
                    ->where('status', 'pending')
                    ->get();
                $excessTotal = (float) $excessCharges->sum('amount');
            }

            $total = $rent + $elec + $water + $lateFee + $excessTotal;

            $bill = $this->billRepo->create([
                'tenant_id' => $data['tenant_id'],
                'rent' => $rent,
                'electricity' => $elec,
                'elec_usage' => $elecUsage,
                'water' => $water,
                'late_fee' => $lateFee,
                'total_amount' => $total,
                'paid_amount' => 0.00,
                'remaining_balance' => $total,
                'date' => $data['date'],
                'due_date' => $data['due_date'],
                'status' => 'unpaid',
                'notes' => $data['notes'] ?? null,
            ]);

            if ($excessCharges->isNotEmpty()) {
                ExcessCharge::whereIn('id', $excessCharges->pluck('id'))->update([
                    'bill_id' => $bill->id,
                    'status' => 'billed',
                ]);
            }

            if ($elecUsage > 0 || $elec > 0) {
                $prev = (float) ($prevReading ?? 0);
                $curr = (float) ($currReading ?? ($prev + $elecUsage));

                $this->readingRepo->create([
                    'tenant_id' => $data['tenant_id'],
                    'bill_id' => $bill->id,
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
        $readings = $this->readingRepo->getLatestReadingsForTenants($tenantIds, true);

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

                // Attach pending excess charges for this tenant
                $pendingCharges = ExcessCharge::where('tenant_id', $tenant->id)
                    ->where('status', 'pending')
                    ->get();
                $excessChargesSum = (float) $pendingCharges->sum('amount');

                $lateFee = isset($overdueTenantIds[$tenant->id]) ? 250.00 : 0.00;
                $total = $rent + $elec + $water + $lateFee + $excessChargesSum;

                $bill = $this->billRepo->create([
                    'tenant_id' => $tenant->id,
                    'rent' => $rent,
                    'electricity' => $elec,
                    'elec_usage' => $elecUsage,
                    'water' => $water,
                    'late_fee' => $lateFee,
                    'total_amount' => $total,
                    'paid_amount' => 0.00,
                    'remaining_balance' => $total,
                    'date' => $formattedBillingDate,
                    'due_date' => $tenantDueDate->format('Y-m-d'),
                    'status' => 'unpaid',
                    'notes' => $coverageNote,
                ]);

                if ($pendingCharges->isNotEmpty()) {
                    ExcessCharge::whereIn('id', $pendingCharges->pluck('id'))->update([
                        'bill_id' => $bill->id,
                        'status' => 'billed',
                    ]);
                }

                if ($latestReading && ! empty($latestReading->id)) {
                    $this->readingRepo->update($latestReading->id, ['bill_id' => $bill->id]);
                }

                $this->tenantRepo->incrementBalance($tenant->id, $total);
                $generated++;
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

        // Status is workflow-owned. Ledger status changes must go through
        // payment verification or voidBill() so paid_amount stays truthful.
        if (array_key_exists('status', $data)) {
            throw new InvalidArgumentException('Invoice status cannot be edited directly. Use the payment or void workflow.');
        }

        $financialFields = ['rent', 'electricity', 'elec_usage', 'water', 'late_fee'];
        $hasFinancialChanges = false;
        foreach ($financialFields as $field) {
            if (isset($data[$field])) {
                $hasFinancialChanges = true;
                break;
            }
        }

        if ($hasFinancialChanges && in_array($bill->status, ['paid', 'voided'], true)) {
            throw new InvalidArgumentException("Cannot modify financial amounts on an invoice that is {$bill->status}.");
        }

        $oldTotal = (float) $bill->total_amount;

        if ($hasFinancialChanges) {
            $newRent = isset($data['rent']) ? (float) $data['rent'] : (float) $bill->rent;
            $newElec = isset($data['electricity']) ? (float) $data['electricity'] : (float) $bill->electricity;
            $newWater = isset($data['water']) ? (float) $data['water'] : (float) $bill->water;
            $newLateFee = isset($data['late_fee']) ? (float) $data['late_fee'] : (float) $bill->late_fee;
            $excessTotal = (float) $bill->excessCharges()->sum('amount');
            $data['total_amount'] = round($newRent + $newElec + $newWater + $newLateFee + $excessTotal, 2);
        }

        return DB::transaction(function () use ($id, $data, $bill, $oldTotal, $hasFinancialChanges) {
            $bill = $this->billRepo->update($id, $data);

            // Reconcile tenant balance accurately with non-negative clamping.
            $tenant = $this->tenantRepo->find((int) $bill->tenant_id);
            if ($tenant && $hasFinancialChanges && ! in_array($bill->status, ['paid', 'voided'], true)) {
                $diff = round((float) $bill->total_amount - $oldTotal, 2);
                if ($diff > 0) {
                    $tenant->increment('balance', $diff);
                } elseif ($diff < 0) {
                    $tenant->decrement('balance', min((float) $tenant->balance, abs($diff)));
                }
            }

            Cache::forget('admin_stats_all');
            Cache::forget("tenant_dashboard_{$bill->tenant_id}");

            return $bill;
        });
    }

    /**
     * Void an invoice that has no recorded money against it. Attached
     * readings and excess charges are released so they can be re-billed.
     */
    public function voidBill(int $id): Bill
    {
        $bill = $this->billRepo->find($id);
        if (! $bill) {
            throw new ModelNotFoundException('Bill not found.');
        }

        if ($bill->status === 'voided') {
            throw new InvalidArgumentException('This invoice has already been voided.');
        }

        if ($bill->status === 'paid' || (float) $bill->paid_amount > 0) {
            throw new InvalidArgumentException('Invoices with recorded payments cannot be voided. Refund or reverse the payment first.');
        }

        return DB::transaction(function () use ($bill) {
            $oldTotal = (float) $bill->total_amount;

            Payment::where('bill_id', $bill->id)
                ->where('status', 'pending')
                ->update(['status' => 'failed']);

            UtilityReading::where('bill_id', $bill->id)->update(['bill_id' => null]);
            ExcessCharge::where('bill_id', $bill->id)->update(['bill_id' => null, 'status' => 'pending']);

            $bill = $this->billRepo->update($bill->id, ['status' => 'voided']);

            $tenant = $this->tenantRepo->find((int) $bill->tenant_id);
            if ($tenant) {
                $tenant->decrement('balance', min((float) $tenant->balance, $oldTotal));
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

        if ((float) $bill->paid_amount > 0 || $bill->payments()->exists()) {
            throw new InvalidArgumentException('Invoices with recorded payments cannot be deleted. Void the invoice instead.');
        }

        return DB::transaction(function () use ($id, $bill) {
            if (in_array($bill->status, ['unpaid', 'pending_verification'], true)) {
                $tenant = $this->tenantRepo->find((int) $bill->tenant_id);
                if ($tenant) {
                    $tenant->decrement('balance', min((float) $tenant->balance, (float) $bill->total_amount));
                }
            }

            // Release attached utility readings and excess charges
            UtilityReading::where('bill_id', $id)->update(['bill_id' => null]);
            ExcessCharge::where('bill_id', $id)->update(['bill_id' => null, 'status' => 'pending']);

            $tenantId = $bill->tenant_id;
            $receiptUrl = $bill->receipt_url;
            $deleted = $this->billRepo->delete($id);

            if ($deleted) {
                PrivateFile::delete($receiptUrl);
            }

            Cache::forget('admin_stats_all');
            Cache::forget("tenant_dashboard_{$tenantId}");

            return $deleted;
        });
    }

    public function bulkDeleteBills(array $ids): int
    {
        $count = 0;
        foreach ($ids as $id) {
            try {
                if ($this->deleteBill((int) $id)) {
                    $count++;
                }
            } catch (ModelNotFoundException) {
                // Skip if already gone
            } catch (InvalidArgumentException) {
                // Skip invoices that must be preserved for the payment ledger
            }
        }
        return $count;
    }

    /**
     * Retrieve tenants with 2 or more unpaid/partially-paid bills past due date.
     */
    public function getDelinquentTenants(): array
    {
        return $this->billRepo->getDelinquentTenantsSummary(now()->format('Y-m-d'));
    }
}
