<?php

namespace App\Repositories\Contracts;

use App\Models\Tenant;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface TenantRepositoryInterface
{
    public function paginate(int $perPage = 50, array $filters = []): LengthAwarePaginator;

    public function find(int $id, array $relations = []): ?Tenant;

    public function findByUserIdOrEmail(int $userId, string $email): ?Tenant;

    public function findActiveInRoom(int $propertyId, string $room, ?int $excludeTenantId = null): ?Tenant;

    public function incrementBalance(int $tenantId, float $amount): bool;

    public function deleteUser(int $userId): bool;

    public function create(array $attributes): Tenant;

    public function update(int $id, array $attributes): Tenant;

    public function delete(int $id): bool;

    public function getActiveTenants(): Collection;
}
