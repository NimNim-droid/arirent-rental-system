<?php

namespace App\Services;

use App\Models\Tenant;
use App\Models\User;
use App\Repositories\Contracts\RoomRepositoryInterface;
use App\Repositories\Contracts\TenantRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpKernel\Exception\HttpException;

class AuthService
{
    public function __construct(
        protected TenantRepositoryInterface $tenantRepo,
        protected RoomRepositoryInterface $roomRepo
    ) {}

    /**
     * Authenticate user, check tenant status, and issue Sanctum token.
     */
    public function login(string $email, string $password): array
    {
        $user = User::where('email', $email)->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            throw new HttpException(401, 'Invalid credentials.');
        }

        $tenant = null;

        if ($user->role === 'tenant') {
            $tenant = $this->tenantRepo->findByUserIdOrEmail($user->id, $user->email);

            if ($tenant && $tenant->status === 'pending_approval') {
                throw new HttpException(403, 'Your account is pending landlord approval.');
            }

            if ($tenant && $tenant->status === 'inactive') {
                throw new HttpException(403, 'Your account has been deactivated.');
            }
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return [
            'token' => $token,
            'user' => [
                'id' => (string) $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'tenant' => $tenant ? [
                    'id' => (string) $tenant->id,
                    'room' => $tenant->room,
                    'property_id' => (string) $tenant->property_id,
                    'status' => $tenant->status,
                    'balance' => (float) $tenant->balance,
                ] : null,
            ],
        ];
    }

    /**
     * Change the authenticated user's password and revoke other sessions.
     */
    public function changePassword(User $user, string $currentPassword, string $newPassword): string
    {
        if (! Hash::check($currentPassword, $user->password)) {
            throw new HttpException(422, 'Current password is incorrect.');
        }

        return DB::transaction(function () use ($user, $newPassword) {
            $user->password = $newPassword;
            $user->save();

            // Keep the legacy tenant password column in sync; it is not used
            // for authentication but can be used by older admin tooling.
            $user->tenant()->update(['password' => $user->password]);

            $user->tokens()->delete();

            return $user->createToken('auth-token')->plainTextToken;
        });
    }

    /**
     * Register a new tenant applicant and reserve the chosen room.
     */
    public function register(array $data): Tenant
    {
        $room = $this->roomRepo->findByPropertyAndNumber((int) $data['property_id'], $data['room_number']);

        if (! $room) {
            throw new HttpException(422, "Room {$data['room_number']} does not exist in the selected property.");
        }

        if (in_array($room->status, ['occupied', 'reserved'])) {
            throw new HttpException(409, 'Selected room is already reserved or occupied.');
        }

        $hashedPassword = Hash::make($data['password']);

        return DB::transaction(function () use ($data, $room, $hashedPassword) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $hashedPassword,
                'role' => 'tenant',
            ]);

            $cleanName = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $data['name']));
            $username = $cleanName . rand(100, 999);

            while (Tenant::where('username', $username)->exists()) {
                $username = $cleanName . rand(100, 999);
            }

            $tenant = $this->tenantRepo->create([
                'user_id' => $user->id,
                'property_id' => $data['property_id'],
                'room' => $data['room_number'],
                'username' => $username,
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'password' => $hashedPassword,
                'status' => 'pending_approval',
                'balance' => 0.00,
                'water_rate' => 500.00,
            ]);

            if ($room) {
                $this->roomRepo->update($room->id, ['status' => 'reserved']);
            }

            return $tenant;
        });
    }

    /**
     * Get user profile with linked tenant information.
     */
    public function getProfile(User $user): array
    {
        $tenant = $this->tenantRepo->findByUserIdOrEmail($user->id, $user->email);
        if ($tenant) {
            $tenant->loadMissing('property');
        }

        return [
            'id' => (string) $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'tenant' => $tenant ? [
                'id' => (string) $tenant->id,
                'room' => $tenant->room,
                'property_id' => (string) $tenant->property_id,
                'property_name' => $tenant->property?->name,
                'status' => $tenant->status,
                'balance' => (float) $tenant->balance,
                'water_rate' => (float) $tenant->water_rate,
                'lease_end' => $tenant->lease_end,
            ] : null,
        ];
    }
}
