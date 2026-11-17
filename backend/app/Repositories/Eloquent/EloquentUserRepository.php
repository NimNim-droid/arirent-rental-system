<?php

namespace App\Repositories\Eloquent;

use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;

class EloquentUserRepository implements UserRepositoryInterface
{
    public function findByEmail(string $email): ?User
    {
        $normalized = strtolower(trim($email));

        // PostgreSQL string equality is case-sensitive; compare lowercased so login behaves like MySQL.
        return User::whereRaw('LOWER(email) = ?', [$normalized])->first();
    }

    public function create(array $attributes): User
    {
        return User::create($attributes);
    }

    public function updatePassword(User $user, string $password): User
    {
        $user->password = $password;
        $user->save();

        return $user;
    }

    public function syncTenantPassword(User $user, string $hashedPassword): void
    {
        $user->tenant()->update(['password' => $hashedPassword]);
    }

    public function delete(int $id): bool
    {
        return (bool) User::where('id', $id)->delete();
    }
}

