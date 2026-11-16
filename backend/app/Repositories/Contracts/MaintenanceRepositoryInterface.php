<?php

namespace App\Repositories\Contracts;

use App\Models\MaintenanceTicket;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface MaintenanceRepositoryInterface
{
    public function paginate(int $perPage = 50, array $filters = []): LengthAwarePaginator;

    /**
     * @return array<string, int> Ticket counts keyed by status.
     */
    public function countByStatus(array $filters = []): array;

    public function find(int $id, array $relations = []): ?MaintenanceTicket;

    public function create(array $attributes): MaintenanceTicket;

    public function update(int $id, array $attributes): MaintenanceTicket;

    public function delete(int $id): bool;

    public function countCreatedTodayForTenant(int $tenantId): int;

    public function getRecent(?int $propertyId = null, int $limit = 5): Collection;

    public function getRecentForTenant(int $tenantId, int $limit = 3): Collection;
}
