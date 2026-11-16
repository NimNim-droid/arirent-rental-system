<?php

namespace App\Services;

use App\Models\Bill;
use App\Repositories\Contracts\ReportRepositoryInterface;
use Illuminate\Support\Carbon;

class ReportService
{
    public function __construct(
        protected ReportRepositoryInterface $reportRepo
    ) {}

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
     * @param int|null $year Calendar year for the executive report view
     */
    public function getFinancialReport(
        ?string $month = null,
        ?int $propertyId = null,
        ?int $year = null
    ): array {
        // 1. Fetch base bills (excluding voided bills) via repository
        $bills = $this->reportRepo->getBillsForReport($month, $propertyId, $year);

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
            $prevMonthCollected = $this->reportRepo->sumCollectedForMonth($prevMonthDate, $propertyId);
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
        $confirmedPayments = $this->reportRepo->sumConfirmedPaymentsForBills($bills->pluck('id')->all());
        $reconciliation = [
            'recorded_paid_amount' => $totalCollected,
            'confirmed_payments' => $confirmedPayments,
            'difference' => round($totalCollected - $confirmedPayments, 2),
            'is_reconciled' => abs($totalCollected - $confirmedPayments) < 0.01,
        ];

        // 5. Per-Property Financial Performance
        $properties = $this->reportRepo->getPropertiesWithRoomsAndTenants($propertyId);

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

            $totals = $this->reportRepo->getMonthlyTrendTotals($ym, $propertyId);

            $monthlyTrend[] = [
                'month' => $ym,
                'label' => $trendLabel,
                'billed' => $totals['billed'],
                'collected' => $totals['collected'],
                'outstanding' => $totals['outstanding'],
            ];
        }

        // 7. Available Months list (for frontend filter dropdown)
        $availableMonths = $this->reportRepo->getAvailableBillMonths();

        // 8. Executive annual view used by the Financial Report page.
        $reportYear = $year
            ?? ($month && preg_match('/^(\d{4})-\d{2}$/', $month, $matches)
                ? (int) $matches[1]
                : (int) now()->year);

        $collectedBreakdown = $this->collectedBreakdown($bills);
        $collectedTotal = array_sum($collectedBreakdown);

        $previousCollected = [
            'rent' => 0.0,
            'electricity' => 0.0,
            'water' => 0.0,
            'excess' => 0.0,
            'late' => 0.0,
        ];
        if ($year) {
            $previousCollected = $this->collectedBreakdown(
                $this->billsForYear($year - 1, $propertyId)
            );
        }

        $summary = [
            'total_revenue' => round($collectedTotal, 2),
            'total_rent' => round($collectedBreakdown['rent'], 2),
            'total_utilities' => round(
                $collectedBreakdown['electricity'] + $collectedBreakdown['water'],
                2
            ),
            'total_other' => round(
                $collectedBreakdown['excess'] + $collectedBreakdown['late'],
                2
            ),
            'growth' => [
                'total_revenue' => $year
                    ? $this->percentChange($collectedTotal, array_sum($previousCollected))
                    : 0.0,
                'total_rent' => $year
                    ? $this->percentChange($collectedBreakdown['rent'], $previousCollected['rent'])
                    : 0.0,
                'total_utilities' => $year
                    ? $this->percentChange(
                        $collectedBreakdown['electricity'] + $collectedBreakdown['water'],
                        $previousCollected['electricity'] + $previousCollected['water']
                    )
                    : 0.0,
                'total_other' => $year
                    ? $this->percentChange(
                        $collectedBreakdown['excess'] + $collectedBreakdown['late'],
                        $previousCollected['excess'] + $previousCollected['late']
                    )
                    : 0.0,
            ],
        ];

        $revenueOverview = $this->collectedMonthlyOverview($bills, $reportYear);

        // Do not plot future months of the current year as zero revenue.
        if ($reportYear === (int) now()->year) {
            $revenueOverview = array_slice($revenueOverview, 0, (int) now()->month);
        }

        $revenueByPeriod = [
            'weekly' => $this->weeklyCollected($bills, $reportYear),
            'monthly' => array_map(
                fn (array $point) => [
                    'label' => $point['month'],
                    'value' => $point['total'],
                ],
                $revenueOverview
            ),
            'yearly' => $this->yearlyCollected($reportYear, $propertyId),
        ];
        $paymentStatus = $this->paymentStatusAnalysis($bills);
        $financialSummary = $this->financialSummary($bills, $reportYear);
        $availableYears = collect($availableMonths)
            ->map(fn (string $ym) => (int) substr($ym, 0, 4))
            ->push($reportYear)
            ->push((int) now()->year)
            ->unique()
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
            'year' => $reportYear,
            'range_label' => 'Jan 1, ' . $reportYear . ' - Dec 31, ' . $reportYear,
            'summary' => $summary,
            'revenue_overview' => $revenueOverview,
            'revenue_by_source' => [
                [
                    'key' => 'rent',
                    'name' => 'Rent',
                    'value' => $summary['total_rent'],
                ],
                [
                    'key' => 'electricity',
                    'name' => 'Electricity',
                    'value' => round($collectedBreakdown['electricity'], 2),
                ],
                [
                    'key' => 'water',
                    'name' => 'Water',
                    'value' => round($collectedBreakdown['water'], 2),
                ],
                [
                    'key' => 'other',
                    'name' => 'Other Charges',
                    'value' => $summary['total_other'],
                ],
            ],
            'revenue_by_period' => $revenueByPeriod,
            'payment_status' => $paymentStatus,
            'financial_summary' => $financialSummary,
            'available_years' => $availableYears,
        ];
    }

    /**
     * Split the amount actually paid on an invoice across its charge lines.
     * Partial payments are allocated proportionally to the billed components.
     *
     * @return array{rent: float, electricity: float, water: float, excess: float, late: float}
     */
    private function paidBreakdown(Bill $bill): array
    {
        $breakdown = [
            'rent' => 0.0,
            'electricity' => 0.0,
            'water' => 0.0,
            'excess' => 0.0,
            'late' => 0.0,
        ];

        $paid = (float) ($bill->paid_amount ?? 0);
        if ($paid <= 0) {
            return $breakdown;
        }

        $components = [
            'rent' => (float) $bill->rent,
            'electricity' => (float) $bill->electricity,
            'water' => (float) $bill->water,
            'excess' => (float) $bill->excessCharges->sum('amount'),
            'late' => (float) $bill->late_fee,
        ];
        $base = array_sum($components);

        if ($base <= 0) {
            $breakdown['rent'] = $paid;

            return $breakdown;
        }

        return array_map(
            fn (float $amount) => $paid * ($amount / $base),
            $components
        );
    }

    /**
     * Collected amount split into the report's revenue categories.
     *
     * @param \Illuminate\Support\Collection<int, Bill> $bills
     * @return array{rent: float, electricity: float, water: float, excess: float, late: float}
     */
    private function collectedBreakdown($bills): array
    {
        $totals = [
            'rent' => 0.0,
            'electricity' => 0.0,
            'water' => 0.0,
            'excess' => 0.0,
            'late' => 0.0,
        ];

        foreach ($bills as $bill) {
            foreach ($this->paidBreakdown($bill) as $key => $amount) {
                $totals[$key] += $amount;
            }
        }

        return $totals;
    }

    private function billDate(Bill $bill): ?Carbon
    {
        if ($bill->date) {
            return Carbon::parse($bill->date);
        }

        return $bill->created_at ? Carbon::parse($bill->created_at) : null;
    }

    /**
     * @param \Illuminate\Support\Collection<int, Bill> $bills
     * @return array<int, array<string, float|string>>
     */
    private function collectedMonthlyOverview($bills, int $year): array
    {
        $months = [];

        for ($month = 1; $month <= 12; $month++) {
            $months[$month] = [
                'month' => Carbon::create($year, $month, 1)->format('M'),
                'rent' => 0.0,
                'utilities' => 0.0,
                'other' => 0.0,
                'total' => 0.0,
            ];
        }

        foreach ($bills as $bill) {
            $date = $this->billDate($bill);
            $paid = (float) ($bill->paid_amount ?? 0);

            if (! $date || (int) $date->format('Y') !== $year || $paid <= 0) {
                continue;
            }

            $breakdown = $this->paidBreakdown($bill);
            $month = (int) $date->format('n');

            $months[$month]['rent'] += $breakdown['rent'];
            $months[$month]['utilities'] += $breakdown['electricity'] + $breakdown['water'];
            $months[$month]['other'] += $breakdown['excess'] + $breakdown['late'];
            $months[$month]['total'] += $paid;
        }

        return array_values(array_map(function (array $month): array {
            return [
                'month' => $month['month'],
                'rent' => round($month['rent'], 2),
                'utilities' => round($month['utilities'], 2),
                'other' => round($month['other'], 2),
                'total' => round($month['total'], 2),
            ];
        }, $months));
    }

    /**
     * Four mutually exclusive buckets used by the payment-status donut.
     *
     * @param \Illuminate\Support\Collection<int, Bill> $bills
     * @return array<string, mixed>
     */
    private function paymentStatusAnalysis($bills): array
    {
        $today = Carbon::today();
        $groups = [
            'paid' => [],
            'pending' => [],
            'partially_paid' => [],
            'overdue' => [],
        ];

        foreach ($bills as $bill) {
            $remaining = (float) ($bill->remaining_balance ?? 0);

            if ($bill->status === 'paid' || $remaining <= 0) {
                $groups['paid'][] = $bill;
                continue;
            }

            if ($bill->status === 'pending_verification') {
                $groups['pending'][] = $bill;
                continue;
            }

            if (
                in_array($bill->status, ['unpaid', 'partially_paid'], true)
                && $bill->due_date !== null
                && $bill->due_date->lt($today)
            ) {
                $groups['overdue'][] = $bill;
                continue;
            }

            if ($bill->status === 'partially_paid') {
                $groups['partially_paid'][] = $bill;
                continue;
            }

            $groups['pending'][] = $bill;
        }

        $items = [
            [
                'key' => 'paid',
                'name' => 'Paid',
                'count' => count($groups['paid']),
                'amount' => round((float) collect($groups['paid'])->sum('paid_amount'), 2),
            ],
            [
                'key' => 'pending',
                'name' => 'Pending',
                'count' => count($groups['pending']),
                'amount' => round((float) collect($groups['pending'])->sum('remaining_balance'), 2),
            ],
            [
                'key' => 'partially_paid',
                'name' => 'Partially Paid',
                'count' => count($groups['partially_paid']),
                'amount' => round((float) collect($groups['partially_paid'])->sum('remaining_balance'), 2),
            ],
            [
                'key' => 'overdue',
                'name' => 'Overdue',
                'count' => count($groups['overdue']),
                'amount' => round((float) collect($groups['overdue'])->sum('remaining_balance'), 2),
            ],
        ];

        return [
            'total' => $bills->count(),
            'items' => $items,
        ];
    }

    /**
     * @param \Illuminate\Support\Collection<int, Bill> $bills
     * @return array<int, array<string, float|int|string>>
     */
    private function financialSummary($bills, int $year): array
    {
        if ($bills->isEmpty()) {
            return [];
        }

        $today = Carbon::today();
        $rows = [];

        for ($month = 1; $month <= 12; $month++) {
            $monthBills = $bills->filter(function (Bill $bill) use ($month, $year) {
                $date = $this->billDate($bill);

                return $date
                    && (int) $date->format('n') === $month
                    && (int) $date->format('Y') === $year;
            });

            $paid = 0.0;
            $pending = 0.0;
            $partiallyPaid = 0.0;
            $overdue = 0.0;
            $excess = 0.0;

            foreach ($monthBills as $bill) {
                $paid += (float) ($bill->paid_amount ?? 0);
                $excess += (float) $bill->excessCharges->sum('amount');
                $remaining = (float) ($bill->remaining_balance ?? 0);

                if ($remaining <= 0) {
                    continue;
                }

                if ($bill->status === 'pending_verification') {
                    $pending += $remaining;
                } elseif (
                    in_array($bill->status, ['unpaid', 'partially_paid'], true)
                    && $bill->due_date !== null
                    && $bill->due_date->lt($today)
                ) {
                    $overdue += $remaining;
                } elseif ($bill->status === 'partially_paid') {
                    $partiallyPaid += $remaining;
                } else {
                    $pending += $remaining;
                }
            }

            $rows[] = [
                'month' => $month,
                'period' => Carbon::create($year, $month, 1)->format('F Y'),
                'total_revenue' => round((float) $monthBills->sum('total_amount'), 2),
                'total_rent' => round((float) $monthBills->sum('rent'), 2),
                'total_utilities' => round(
                    (float) $monthBills->sum('electricity') + (float) $monthBills->sum('water'),
                    2
                ),
                'total_other' => round((float) $monthBills->sum('late_fee') + $excess, 2),
                'paid' => round($paid, 2),
                'pending' => round($pending, 2),
                'partially_paid' => round($partiallyPaid, 2),
                'overdue' => round($overdue, 2),
                'outstanding' => round($pending + $partiallyPaid + $overdue, 2),
            ];
        }

        return $rows;
    }

    /**
     * @param \Illuminate\Support\Collection<int, Bill> $bills
     * @return array<int, array{label: string, value: float}>
     */
    private function weeklyCollected($bills, int $year): array
    {
        $end = $year === now()->year
            ? now()->endOfWeek()
            : Carbon::create($year, 12, 31)->endOfWeek();
        $start = $end->copy()->subWeeks(11)->startOfWeek();
        $totals = [];

        foreach ($bills as $bill) {
            $date = $this->billDate($bill);

            if (! $date || $date->lt($start) || $date->gt($end)) {
                continue;
            }

            $key = $date->copy()->startOfWeek()->toDateString();
            $totals[$key] = ($totals[$key] ?? 0) + (float) ($bill->paid_amount ?? 0);
        }

        $points = [];

        for ($week = 0; $week < 12; $week++) {
            $weekStart = $start->copy()->addWeeks($week);
            $points[] = [
                'label' => $weekStart->format('M j'),
                'value' => round($totals[$weekStart->toDateString()] ?? 0, 2),
            ];
        }

        return $points;
    }

    /**
     * @return array<int, array{label: string, value: float}>
     */
    private function yearlyCollected(int $year, ?int $propertyId): array
    {
        $startYear = $year - 4;
        $bills = $this->reportRepo->getBillsInDateRange(
            Carbon::create($startYear, 1, 1)->startOfDay(),
            Carbon::create($year, 12, 31)->endOfDay(),
            $propertyId
        );

        $totals = [];

        foreach ($bills as $bill) {
            $date = $this->billDate($bill);
            if (! $date) {
                continue;
            }

            $billYear = (int) $date->format('Y');
            $totals[$billYear] = ($totals[$billYear] ?? 0)
                + (float) ($bill->paid_amount ?? 0);
        }

        $points = [];

        for ($pointYear = $startYear; $pointYear <= $year; $pointYear++) {
            $points[] = [
                'label' => (string) $pointYear,
                'value' => round($totals[$pointYear] ?? 0, 2),
            ];
        }

        return $points;
    }

    /**
     * @return \Illuminate\Database\Eloquent\Collection<int, Bill>
     */
    private function billsForYear(int $year, ?int $propertyId)
    {
        return $this->reportRepo->getBillsInDateRange(
            Carbon::create($year, 1, 1)->startOfDay(),
            Carbon::create($year, 12, 31)->endOfDay(),
            $propertyId
        );
    }

    private function percentChange(float $current, float $previous): float
    {
        if ($previous <= 0) {
            return $current > 0 ? 100.0 : 0.0;
        }

        return round((($current - $previous) / $previous) * 100, 1);
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
        $bills = $this->reportRepo->getOpenBillsForArAging($propertyId);

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
