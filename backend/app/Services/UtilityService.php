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
use InvalidArgumentException;

class UtilityService
{
    public function __construct(
        protected ReadingRepositoryInterface $readingRepo,
        protected BillRepositoryInterface $billRepo,
        protected TenantRepositoryInterface $tenantRepo,
        protected SettingsRepositoryInterface $settingsRepo
    ) {}

    public function recordReading(int $tenantId, float $prev, float $curr, string $date, ?string $meterPhotoUrl = null): array
    {
        $usage = max(0, round($curr - $prev, 2));

        $settings = $this->settingsRepo->getGlobal();
        $elecRate = (float) $settings->elec_rate;
        $amount = round($usage * $elecRate, 2);

        $readingDate = Carbon::parse($date);
        $monthStart = $readingDate->copy()->startOfMonth()->format('Y-m-d');
        $monthEnd = $readingDate->copy()->endOfMonth()->format('Y-m-d');

        return DB::transaction(function () use ($tenantId, $prev, $curr, $usage, $amount, $date, $monthStart, $monthEnd, $elecRate, $meterPhotoUrl) {
            $unpaidBill = $this->billRepo->findForTenantInMonth($tenantId, $monthStart, $monthEnd, 'unpaid');

            $reading = $this->readingRepo->create([
                'tenant_id' => $tenantId,
                'bill_id' => $unpaidBill ? $unpaidBill->id : null,
                'prev_reading' => $prev,
                'curr_reading' => $curr,
                'usage_kwh' => $usage,
                'amount' => $amount,
                'date' => $date,
                'meter_photo_url' => $meterPhotoUrl,
            ]);

            $billUpdated = false;

            if ($unpaidBill) {
                $oldTotal = (float) $unpaidBill->total_amount;

                $unpaidBill->electricity = $amount;
                $unpaidBill->elec_usage = $usage;
                $unpaidBill->recalculateTotal();
                $unpaidBill->save();

                $diff = round((float) $unpaidBill->total_amount - $oldTotal, 2);

                if ($diff != 0) {
                    $tenant = $this->tenantRepo->find($tenantId);
                    if ($tenant) {
                        $tenant->increment('balance', $diff);
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
            $bill = $reading->bill_id
                ? $this->billRepo->find((int) $reading->bill_id)
                : $this->billRepo->findForTenantInMonth(
                    $reading->tenant_id,
                    Carbon::parse($reading->date)->startOfMonth()->format('Y-m-d'),
                    Carbon::parse($reading->date)->endOfMonth()->format('Y-m-d'),
                    'unpaid'
                );

            if ($bill) {
                if (in_array($bill->status, ['paid', 'voided'], true)) {
                    throw new InvalidArgumentException("Cannot delete a reading attached to a {$bill->status} invoice.");
                }

                $oldElec = (float) $bill->electricity;
                $readingAmount = (float) $reading->amount;

                // Only reverse if the bill's electricity matches this reading
                if (abs($oldElec - $readingAmount) < 0.01) {
                    $oldTotal = (float) $bill->total_amount;

                    $bill->electricity = 0;
                    $bill->elec_usage = 0;
                    $bill->recalculateTotal();

                    if ((float) $bill->paid_amount > (float) $bill->total_amount) {
                        throw new InvalidArgumentException('Deleting this reading would reduce the invoice below the amount already paid.');
                    }

                    $bill->save();

                    // Reverse tenant balance adjustment with floor
                    $diff = round($oldTotal - (float) $bill->total_amount, 2);
                    if ($diff != 0) {
                        $tenant = $this->tenantRepo->find($reading->tenant_id);
                        if ($tenant) {
                            $tenant->decrement('balance', min((float) $tenant->balance, $diff));
                        }
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
