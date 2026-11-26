<?php

namespace App\Repositories\Contracts;

use App\Models\Inquiry;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface InquiryRepositoryInterface
{
    public function paginate(int $perPage = 50, array $filters = []): LengthAwarePaginator;

    public function find(int $id, array $relations = []): ?Inquiry;

    public function create(array $attributes): Inquiry;

    public function update(int $id, array $attributes): Inquiry;

    public function delete(int $id): bool;

    /**
     * @return array<string, int>
     */
    public function getStatusCounts(?int $propertyId = null): array;

    public function countNew(?int $propertyId = null): int;

    /**
     * Find the latest open inquiry matching an applicant's email or phone for a property/room.
     */
    public function findMatchingOpenForApplicant(
        int $propertyId,
        ?int $roomId,
        ?string $email,
        ?string $phone
    ): ?Inquiry;
}
