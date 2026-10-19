<?php

namespace App\Repositories\Contracts;

use App\Models\UtilityReading;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface ReadingRepositoryInterface
{
    public function paginate(int $perPage = 50, array $filters = []): LengthAwarePaginator;

    public function find(int $id, array $relations = []): ?UtilityReading;

    public function create(array $attributes): UtilityReading;

    public function delete(int $id): bool;

    public function getLatestReadingForTenant(int $tenantId): ?UtilityReading;

    public function getLatestReadingsForTenants(array $tenantIds): Collection;
}
