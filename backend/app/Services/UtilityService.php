<?php

namespace App\Services;

use App\Models\UtilityReading;
use App\Repositories\Contracts\BillRepositoryInterface;
use App\Repositories\Contracts\ReadingRepositoryInterface;
use App\Repositories\Contracts\SettingsRepositoryInterface;
use App\Repositories\Contracts\TenantRepositoryInterface;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class UtilityService
{
    public function __construct(
        protected ReadingRepositoryInterface $readingRepo,
        protected BillRepositoryInterface $billRepo,
        protected TenantRepositoryInterface $tenantRepo,
        protected SettingsRepositoryInterface $settingsRepo
    ) {}

    public function recordReading(int $tenantId, float $prev, float $curr, string $date): array
    {
        $usage = max(0, round($curr - $prev, 2));

        $settings = $this->settingsRepo->getGlobal();
        $elecRate = (float) $settings->elec_rate;
        $amount = round($usage * $elecRate, 2);

        $readingDate = Carbon::parse($date);
        $monthStart = $readingDate->copy()->startOfMonth()->format('Y-m-d');
        $monthEnd = $readingDate->copy()->endOfMonth()->format('Y-m-d');

        return DB::transaction(function () use ($tenantId, $prev, $curr, $usage, $amount, $date, $monthStart, $monthEnd, $elecRate) {
            $unpaidBill = $this->billRepo->findForTenantInMonth($tenantId, $monthStart, $monthEnd, 'unpaid');

            $reading = $this->readingRepo->create([
                'tenant_id' => $tenantId,
                'bill_id' => $unpaidBill ? $unpaidBill->id : null,
                'prev_reading' => $prev,
                'curr_reading' => $curr,
                'usage_kwh' => $usage,
                'amount' => $amount,
                'date' => $date,
            ]);

            $billUpdated = false;

            if ($unpaidBill) {
                $prevElec = (float) $unpaidBill->electricity;
                $elecDiff = $amount - $prevElec;

                $unpaidBill->update([
                    'electricity' => $amount,
                    'elec_usage' => $usage,
                    'total_amount' => (float) $unpaidBill->total_amount + $elecDiff,
                ]);

                if ($elecDiff != 0) {
                    $tenant = $this->tenantRepo->find($tenantId);
                    if ($tenant) {
                        $tenant->increment('balance', $elecDiff);
                    }
                }

                $billUpdated = true;
            }

            Cache::forget('admin_stats_all');
            Cache::forget("tenant_dashboard_{$tenantId}");

            return [
                'reading' => $reading,
                'bill_updated' => $billUpdated,
                'rate_applied' => $elecRate,
            ];
        });
    }

    public function deleteReading(int $id): bool
    {
        $reading = $this->readingRepo->find($id);
        if (! $reading) {
            throw new ModelNotFoundException('Reading not found.');
        }

        return DB::transaction(function () use ($id, $reading) {
            $readingDate = Carbon::parse($reading->date);
            $monthStart = $readingDate->copy()->startOfMonth()->format('Y-m-d');
            $monthEnd = $readingDate->copy()->endOfMonth()->format('Y-m-d');

            $bill = $this->billRepo->findForTenantInMonth($reading->tenant_id, $monthStart, $monthEnd, 'unpaid');

            if ($bill) {
                $oldElec = (float) $bill->electricity;
                $readingAmount = (float) $reading->amount;

                // Only reverse if the bill's electricity matches this reading
                if (abs($oldElec - $readingAmount) < 0.01) {
                    $bill->electricity = 0;
                    $bill->elec_usage = 0;
                    $bill->total_amount = (float) $bill->rent + (float) $bill->water + (float) $bill->late_fee;
                    $bill->save();

                    // Reverse tenant balance adjustment with floor
                    $tenant = $this->tenantRepo->find($reading->tenant_id);
                    if ($tenant) {
                        $tenant->decrement('balance', min((float) $tenant->balance, $readingAmount));
                    }
                }
            }

            $tenantId = $reading->tenant_id;
            $deleted = $this->readingRepo->delete($id);

            Cache::forget('admin_stats_all');
            Cache::forget("tenant_dashboard_{$tenantId}");

            return $deleted;
        });
    }
}
