<?php

namespace App\Repositories\Contracts;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;

interface ReportRepositoryInterface
{
    public function getBillsForReport(?string $month, ?int $propertyId, ?int $year): Collection;

    public function sumCollectedForMonth(string $month, ?int $propertyId): float;

    public function sumConfirmedPaymentsForBills(array $billIds): float;

    public function getPropertiesWithRoomsAndTenants(?int $propertyId): Collection;

    /**
     * @return array{billed: float, collected: float, outstanding: float}
     */
    public function getMonthlyTrendTotals(string $yearMonth, ?int $propertyId): array;

    /**
     * @return array<int, string>
     */
    public function getAvailableBillMonths(): array;

    public function getBillsInDateRange(Carbon $from, Carbon $to, ?int $propertyId): Collection;

    public function getOpenBillsForArAging(?int $propertyId): Collection;
}

