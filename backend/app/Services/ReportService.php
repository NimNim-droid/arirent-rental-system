<?php

namespace App\Services;

use App\Models\Bill;
use App\Models\Payment;
use App\Models\Property;
use App\Models\Room;
use App\Models\Tenant;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ReportService
{
    /**
     * Accounts-receivable aging buckets, measured in days past the invoice due date.
     * 'current' means not yet due (including due today).
     */
    private const AGING_BUCKETS = [
        ['key' => 'current', 'label' => 'Current', 'min' => 0, 'max' => 0],
        ['key' => '1_30', 'label' => '1-30 days', 'min' => 1, 'max' => 30],
        ['key' => '31_60', 'label' => '31-60 days', 'min' => 31, 'max' => 60],
        ['key' => '61_90', 'label' => '61-90 days', 'min' => 61, 'max' => 90],
        ['key' => 'over_90', 'label' => 'Over 90 days', 'min' => 91, 'max' => null],
    ];

    /**
     * Generate comprehensive financial analytics report.
     *
     * @param string|null $month 'YYYY-MM' or null for all
     * @param int|null $propertyId
     */
    public function getFinancialReport(?string $month = null, ?int $propertyId = null): array
    {
        // 1. Build base bills query (excluding voided bills)
        $billsQuery = Bill::query()->where('status', '!=', 'voided');

        if ($propertyId) {
            $billsQuery->whereHas('tenant', fn ($q) => $q->where('property_id', $propertyId));
        }

        if ($month && $month !== 'all') {
            $billsQuery->where(function ($q) use ($month) {
                $q->where('date', 'like', "{$month}%")
                  ->orWhere(function ($sq) use ($month) {
                      $sq->whereNull('date')
                         ->where('created_at', 'like', "{$month}%");
                  });
            });
        }

        $bills = $billsQuery->with(['tenant.property', 'excessCharges'])->get();

        // 2. Calculate Top-Level KPIs
        $totalBilled = (float) $bills->sum('total_amount');
        $totalCollected = (float) $bills->sum('paid_amount');
        $totalOutstanding = (float) $bills->sum('remaining_balance');
        $collectionRate = $totalBilled > 0 ? round(($totalCollected / $totalBilled) * 100, 1) : 0.0;

        // Compare with previous month if a specific month is provided
        $prevMonthCollected = 0.0;
        $growthRate = 0.0;
        if ($month && $month !== 'all' && preg_match('/^\d{4}-\d{2}$/', $month)) {
            $prevMonthDate = Carbon::createFromFormat('Y-m', $month)->subMonth()->format('Y-m');
            $prevBillsQuery = Bill::query()->where('status', '!=', 'voided');
            if ($propertyId) {
                $prevBillsQuery->whereHas('tenant', fn ($q) => $q->where('property_id', $propertyId));
            }
            $prevBillsQuery->where(function ($q) use ($prevMonthDate) {
                $q->where('date', 'like', "{$prevMonthDate}%")
                  ->orWhere(function ($sq) use ($prevMonthDate) {
                      $sq->whereNull('date')
                         ->where('created_at', 'like', "{$prevMonthDate}%");
                  });
            });
            $prevMonthCollected = (float) $prevBillsQuery->sum('paid_amount');
            if ($prevMonthCollected > 0) {
                $growthRate = round((($totalCollected - $prevMonthCollected) / $prevMonthCollected) * 100, 1);
            }
        }

        // 3. Revenue Stream Breakdown
        $rentSum = (float) $bills->sum('rent');
        $electricitySum = (float) $bills->sum('electricity');
        $waterSum = (float) $bills->sum('water');
        $excessChargesSum = 0.0;
        foreach ($bills as $bill) {
            $excessChargesSum += (float) $bill->excessCharges->sum('amount');
        }
        $lateFeesSum = (float) $bills->sum('late_fee');

        $streamsTotal = $totalBilled ?: 1;
        $revenueStreams = [
            'rent' => [
                'amount' => $rentSum,
                'percentage' => round(($rentSum / $streamsTotal) * 100, 1),
            ],
            'electricity' => [
                'amount' => $electricitySum,
                'percentage' => round(($electricitySum / $streamsTotal) * 100, 1),
            ],
            'water' => [
                'amount' => $waterSum,
                'percentage' => round(($waterSum / $streamsTotal) * 100, 1),
            ],
            'excess_charges' => [
                'amount' => $excessChargesSum,
                'percentage' => round(($excessChargesSum / $streamsTotal) * 100, 1),
            ],
            'late_fees' => [
                'amount' => $lateFeesSum,
                'percentage' => round(($lateFeesSum / $streamsTotal) * 100, 1),
            ],
        ];

        // 4. Status Counts
        // 'overdue' is NOT a stored status in this system. It is derived with the same rule
        // used by EloquentBillRepository: unpaid/partially_paid AND due_date earlier than today.
        // Buckets are mutually exclusive so they always add up to total_bills.
        $today = Carbon::today();
        $isOverdue = fn (Bill $b): bool => in_array($b->status, ['unpaid', 'partially_paid'], true)
            && $b->due_date !== null
            && $b->due_date->lt($today);

        $overdueBills = $bills->filter($isOverdue);
        $overdueAmount = (float) $overdueBills->sum('remaining_balance');

        $statusCounts = [
            'paid' => $bills->where('status', 'paid')->count(),
            'partially_paid' => $bills->where('status', 'partially_paid')->reject($isOverdue)->count(),
            'unpaid' => $bills->where('status', 'unpaid')->reject($isOverdue)->count(),
            'overdue' => $overdueBills->count(),
            'pending_verification' => $bills->where('status', 'pending_verification')->count(),
            'total_bills' => $bills->count(),
        ];

        // Reconciliation: bill-level paid_amount vs confirmed rows in the payments ledger
        $confirmedPayments = (float) Payment::query()
            ->whereIn('bill_id', $bills->pluck('id'))
            ->where('status', 'confirmed')
            ->sum('amount');
        $reconciliation = [
            'recorded_paid_amount' => $totalCollected,
            'confirmed_payments' => $confirmedPayments,
            'difference' => round($totalCollected - $confirmedPayments, 2),
            'is_reconciled' => abs($totalCollected - $confirmedPayments) < 0.01,
        ];

        // 5. Per-Property Financial Performance
        $propertiesQuery = Property::with(['rooms', 'tenants'])->orderBy('name');
        if ($propertyId) {
            $propertiesQuery->where('id', $propertyId);
        }
        $properties = $propertiesQuery->get();

        $propertyPerformance = $properties->map(function ($p) use ($bills) {
            $propBills = $bills->filter(function ($b) use ($p) {
                return (int) $b->tenant?->property_id === (int) $p->id;
            });

            $propBilled = (float) $propBills->sum('total_amount');
            $propCollected = (float) $propBills->sum('paid_amount');
            $propOutstanding = (float) $propBills->sum('remaining_balance');
            $propRate = $propBilled > 0 ? round(($propCollected / $propBilled) * 100, 1) : 0.0;

            $totalRooms = $p->rooms->count();
            $occupiedRooms = $p->rooms->where('status', 'occupied')->count();
            $occupancyRate = $totalRooms > 0 ? round(($occupiedRooms / $totalRooms) * 100, 1) : 0.0;

            return [
                'property_id' => (string) $p->id,
                'property_name' => $p->name,
                'city' => $p->city,
                'total_units' => $totalRooms,
                'occupied_units' => $occupiedRooms,
                'occupancy_rate' => $occupancyRate,
                'billed_amount' => $propBilled,
                'collected_amount' => $propCollected,
                'outstanding_amount' => $propOutstanding,
                'collection_rate' => $propRate,
                'bill_count' => $propBills->count(),
            ];
        })->values()->all();

        // 6. Last 6 Months Monthly Trend
        $monthlyTrend = [];
        for ($i = 5; $i >= 0; $i--) {
            $trendDate = Carbon::now()->subMonths($i);
            $ym = $trendDate->format('Y-m');
            $trendLabel = $trendDate->format('M Y');

            $monthQuery = Bill::query()->where('status', '!=', 'voided');
            if ($propertyId) {
                $monthQuery->whereHas('tenant', fn ($q) => $q->where('property_id', $propertyId));
            }
            $monthQuery->where(function ($q) use ($ym) {
                $q->where('date', 'like', "{$ym}%")
                  ->orWhere(function ($sq) use ($ym) {
                      $sq->whereNull('date')
                         ->where('created_at', 'like', "{$ym}%");
                  });
            });

            $mBilled = (float) $monthQuery->sum('total_amount');
            $mCollected = (float) $monthQuery->sum('paid_amount');
            $mOutstanding = (float) $monthQuery->sum('remaining_balance');

            $monthlyTrend[] = [
                'month' => $ym,
                'label' => $trendLabel,
                'billed' => $mBilled,
                'collected' => $mCollected,
                'outstanding' => $mOutstanding,
            ];
        }

        // 7. Available Months list (for frontend filter dropdown)
        $availableMonths = Bill::where('status', '!=', 'voided')
            ->selectRaw('DISTINCT SUBSTRING(COALESCE(date, created_at), 1, 7) as ym')
            ->whereNotNull(DB::raw('COALESCE(date, created_at)'))
            ->pluck('ym')
            ->filter(fn ($ym) => preg_match('/^\d{4}-\d{2}$/', $ym))
            ->sortDesc()
            ->values()
            ->all();

        return [
            'period' => $month ?: 'all',
            'property_id' => $propertyId,
            'kpis' => [
                'total_billed' => $totalBilled,
                'total_collected' => $totalCollected,
                'total_outstanding' => $totalOutstanding,
                'collection_rate' => $collectionRate,
                'previous_month_collected' => $prevMonthCollected,
                'growth_rate' => $growthRate,
                'overdue_amount' => $overdueAmount,
                'overdue_count' => $overdueBills->count(),
            ],
            'reconciliation' => $reconciliation,
            'revenue_streams' => $revenueStreams,
            'status_counts' => $statusCounts,
            'property_performance' => $propertyPerformance,
            'monthly_trend' => $monthlyTrend,
            'ar_aging' => $this->getArAging($propertyId),
            'available_months' => $availableMonths,
        ];
    }

    /**
     * Accounts-receivable aging as of today.
     *
     * Covers invoices that are unpaid or partially paid and still have a balance.
     * It is a snapshot of what is owed now, so the Month filter does not apply;
     * the Property filter does. Voided invoices and invoices whose payment is
     * awaiting verification are not included.
     */
    private function getArAging(?int $propertyId): array
    {
        $today = Carbon::today();

        $query = Bill::query()
            ->whereIn('status', ['unpaid', 'partially_paid'])
            ->where('remaining_balance', '>', 0)
            ->with('tenant.property');

        if ($propertyId) {
            $query->whereHas('tenant', fn ($q) => $q->where('property_id', $propertyId));
        }

        $bills = $query->get();

        $buckets = [];
        foreach (self::AGING_BUCKETS as $def) {
            $buckets[$def['key']] = [
                'key' => $def['key'],
                'label' => $def['label'],
                'bill_count' => 0,
                'amount' => 0.0,
            ];
        }

        $items = [];
        foreach ($bills as $bill) {
            $balance = (float) $bill->remaining_balance;
            $daysPastDue = $bill->due_date
                ? max(0, intdiv($today->timestamp - $bill->due_date->copy()->startOfDay()->timestamp, 86400))
                : 0;
            $bucketKey = $this->agingBucketKey($daysPastDue);

            $buckets[$bucketKey]['bill_count']++;
            $buckets[$bucketKey]['amount'] += $balance;

            $items[] = [
                'bill_id' => $bill->id,
                'tenant_id' => $bill->tenant_id,
                'tenant_name' => $bill->tenant?->name ?? 'Unknown',
                'room' => $bill->tenant?->room,
                'property_name' => $bill->tenant?->property?->name,
                'status' => $bill->status,
                'due_date' => $bill->due_date?->format('Y-m-d'),
                'days_past_due' => $daysPastDue,
                'remaining_balance' => $balance,
                'bucket' => $bucketKey,
            ];
        }

        // Most overdue first; larger balance first when equally late
        usort($items, fn ($a, $b) => [$b['days_past_due'], $b['remaining_balance']]
            <=> [$a['days_past_due'], $a['remaining_balance']]);

        $buckets = array_map(function ($bucket) {
            $bucket['amount'] = round($bucket['amount'], 2);

            return $bucket;
        }, array_values($buckets));

        return [
            'as_of' => $today->format('Y-m-d'),
            'total_outstanding' => round(array_sum(array_column($buckets, 'amount')), 2),
            'buckets' => $buckets,
            'items' => $items,
        ];
    }

    private function agingBucketKey(int $daysPastDue): string
    {
        foreach (self::AGING_BUCKETS as $def) {
            if ($daysPastDue >= $def['min'] && ($def['max'] === null || $daysPastDue <= $def['max'])) {
                return $def['key'];
            }
        }

        return 'current';
    }
}
