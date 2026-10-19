<?php

namespace App\Repositories\Contracts;

use App\Models\Property;
use Illuminate\Database\Eloquent\Collection;

interface PropertyRepositoryInterface
{
    public function allWithCounts(): Collection;

    public function find(int $id, array $relations = []): ?Property;

    public function create(array $attributes): Property;

    public function update(int $id, array $attributes): Property;

    public function delete(int $id): bool;
}
