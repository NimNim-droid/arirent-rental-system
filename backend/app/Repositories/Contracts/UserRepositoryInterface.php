<?php

namespace App\Repositories\Contracts;

use App\Models\User;

interface UserRepositoryInterface
{
    public function findByEmail(string $email): ?User;

    public function create(array $attributes): User;

    public function updatePassword(User $user, string $password): User;

    public function syncTenantPassword(User $user, string $hashedPassword): void;

    public function delete(int $id): bool;
}

