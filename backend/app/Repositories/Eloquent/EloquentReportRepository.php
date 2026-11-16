<?php

namespace App\Repositories\Eloquent;

use App\Models\Bill;
use App\Models\Payment;
use App\Models\Property;
use App\Repositories\Contracts\ReportRepositoryInterface;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;

class EloquentReportRepository implements ReportRepositoryInterface
{
    public function getBillsForReport(?string $month, ?int $propertyId, ?int $year): Collection
    {
        $query = $this->baseNonVoidedBillsQuery($propertyId);

        if ($month && $month !== 'all') {
            $this->applyMonthFilter($query, $month);
        }

        if ($year) {
            $query->where(function (Builder $q) use ($year) {
                $q->whereYear('date', $year)
                    ->orWhere(function (Builder $sq) use ($year) {
                        $sq->whereNull('date')->whereYear('created_at', $year);
                    });
            });
        }

        return $query->with(['tenant.property', 'excessCharges'])->get();
    }

    public function sumCollectedForMonth(string $month, ?int $propertyId): float
    {
        $query = $this->baseNonVoidedBillsQuery($propertyId);
        $this->applyMonthFilter($query, $month);

        return (float) $query->sum('paid_amount');
    }

    public function sumConfirmedPaymentsForBills(array $billIds): float
    {
        if (empty($billIds)) {
            return 0.0;
        }

        return (float) Payment::query()
            ->whereIn('bill_id', $billIds)
            ->where('status', 'confirmed')
            ->sum('amount');
    }

    public function getPropertiesWithRoomsAndTenants(?int $propertyId): Collection
    {
        $query = Property::with(['rooms', 'tenants'])->orderBy('name');

        if ($propertyId) {
            $query->where('id', $propertyId);
        }

        return $query->get();
    }

    public function getMonthlyTrendTotals(string $yearMonth, ?int $propertyId): array
    {
        $query = $this->baseNonVoidedBillsQuery($propertyId);
        $this->applyMonthFilter($query, $yearMonth);

        return [
            'billed' => (float) (clone $query)->sum('total_amount'),
            'collected' => (float) (clone $query)->sum('paid_amount'),
            'outstanding' => (float) (clone $query)->sum('remaining_balance'),
        ];
    }

    public function getAvailableBillMonths(): array
    {
        return Bill::where('status', '!=', 'voided')
            ->get(['date', 'created_at'])
            ->map(function (Bill $bill) {
                $raw = $bill->date ?? $bill->created_at;
                if (! $raw) {
                    return null;
                }

                return $raw instanceof CarbonInterface
                    ? $raw->format('Y-m')
                    : Carbon::parse((string) $raw)->format('Y-m');
            })
            ->filter(fn ($ym) => is_string($ym) && preg_match('/^\d{4}-\d{2}$/', $ym))
            ->unique()
            ->sortDesc()
            ->values()
            ->all();
    }

    public function getBillsInDateRange(Carbon $from, Carbon $to, ?int $propertyId): Collection
    {
        $query = $this->baseNonVoidedBillsQuery($propertyId)
            ->with(['tenant.property', 'excessCharges']);

        $query->where(function (Builder $q) use ($from, $to) {
            $q->whereBetween('date', [$from->toDateString(), $to->toDateString()])
                ->orWhere(function (Builder $sq) use ($from, $to) {
                    $sq->whereNull('date')
                        ->whereBetween('created_at', [$from, $to]);
                });
        });

        return $query->get();
    }

    public function getOpenBillsForArAging(?int $propertyId): Collection
    {
        $query = Bill::query()
            ->whereIn('status', ['unpaid', 'partially_paid'])
            ->where('remaining_balance', '>', 0)
            ->with('tenant.property');

        if ($propertyId) {
            $query->whereHas('tenant', fn ($q) => $q->where('property_id', $propertyId));
        }

        return $query->get();
    }

    private function baseNonVoidedBillsQuery(?int $propertyId): Builder
    {
        $query = Bill::query()->where('status', '!=', 'voided');

        if ($propertyId) {
            $query->whereHas('tenant', fn ($q) => $q->where('property_id', $propertyId));
        }

        return $query;
    }

    private function applyMonthFilter(Builder $query, string $yearMonth): void
    {
        if (! preg_match('/^\d{4}-\d{2}$/', $yearMonth)) {
            $query->whereRaw('1 = 0');
            return;
        }

        $monthStart = Carbon::createFromFormat('Y-m', $yearMonth)->startOfMonth();
        $monthEnd = $monthStart->copy()->endOfMonth();

        $query->where(function (Builder $q) use ($monthStart, $monthEnd) {
            $q->whereBetween('date', [$monthStart->toDateString(), $monthEnd->toDateString()])
                ->orWhere(function (Builder $sq) use ($monthStart, $monthEnd) {
                    $sq->whereNull('date')
                        ->whereBetween('created_at', [$monthStart->copy()->startOfDay(), $monthEnd->copy()->endOfDay()]);
                });
        });
    }
}

