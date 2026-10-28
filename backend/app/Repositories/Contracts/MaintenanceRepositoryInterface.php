<?php

namespace App\Repositories\Contracts;

use App\Models\MaintenanceTicket;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

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
}
