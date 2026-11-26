<?php

namespace App\Repositories\Contracts;

use App\Models\Room;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Collection as BaseCollection;

interface RoomRepositoryInterface
{
    public function get(array $filters = []): Collection;

    public function find(int $id, array $relations = []): ?Room;

    public function findForUpdate(int $id): ?Room;

    public function findPublicRoom(int $id): ?Room;

    public function findByPropertyAndNumber(int $propertyId, string $roomNumber): ?Room;

    public function findByPropertyAndNumberForUpdate(int $propertyId, string $roomNumber): ?Room;

    public function create(array $attributes): Room;

    public function update(int $id, array $attributes): Room;

    public function delete(int $id): bool;

    public function getRoomsByPropertyIds(array $propertyIds): BaseCollection;

    /**
     * @return array{total: int, occupied: int}
     */
    public function getOccupancyStats(?int $propertyId = null): array;

    public function deleteByPropertyId(int $propertyId): int;
}
