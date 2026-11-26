<?php

namespace App\Services;

use App\Exceptions\DomainException;
use App\Models\Tenant;
use App\Models\User;
use App\Repositories\Contracts\InquiryRepositoryInterface;
use App\Repositories\Contracts\RoomRepositoryInterface;
use App\Repositories\Contracts\TenantRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AuthService
{
    public function __construct(
        protected UserRepositoryInterface $userRepo,
        protected TenantRepositoryInterface $tenantRepo,
        protected RoomRepositoryInterface $roomRepo,
        protected InquiryRepositoryInterface $inquiryRepo
    ) {}

    /**
     * Authenticate user, check tenant status, and issue Sanctum token.
     */
    public function login(string $email, string $password): array
    {
        $user = $this->userRepo->findByEmail($email);

        if (! $user || ! Hash::check($password, $user->password)) {
            throw new DomainException('Invalid credentials.', 401);
        }

        $tenant = null;

        if ($user->role === 'tenant') {
            $tenant = $this->tenantRepo->findByUserIdOrEmail($user->id, $user->email);

            if ($tenant && $tenant->status === 'pending_approval') {
                throw new DomainException('Your account is pending landlord approval.', 403);
            }

            if ($tenant && $tenant->status === 'inactive') {
                throw new DomainException('Your account has been deactivated.', 403);
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
            throw new DomainException('Current password is incorrect.', 422);
        }

        return DB::transaction(function () use ($user, $newPassword) {
            $this->userRepo->updatePassword($user, $newPassword);

            // Keep the legacy tenant password column in sync; it is not used
            // for authentication but can be used by older admin tooling.
            $this->userRepo->syncTenantPassword($user, $user->password);

            $user->tokens()->delete();

            return $user->createToken('auth-token')->plainTextToken;
        });
    }

    /**
     * Register a new tenant applicant, atomically lock & reserve the chosen room,
     * and link any prior viewing inquiry from the same prospect.
     */
    public function register(array $data): Tenant
    {
        $hashedPassword = Hash::make($data['password']);

        $tenant = DB::transaction(function () use ($data, $hashedPassword) {
            $room = ! empty($data['room_id'])
                ? $this->roomRepo->findForUpdate((int) $data['room_id'])
                : $this->roomRepo->findByPropertyAndNumberForUpdate(
                    (int) $data['property_id'],
                    (string) $data['room_number']
                );

            if (! $room) {
                $label = $data['room_number'] ?? ($data['room_id'] ?? 'selected');
                throw new DomainException("Room {$label} does not exist in the selected property.", 422);
            }

            if ($room->is_listed === false) {
                throw new DomainException('This unit is not currently open for online applications.', 422);
            }

            if (in_array($room->status, ['occupied', 'reserved'], true)) {
                throw new DomainException('Selected room is already reserved or occupied.', 409);
            }

            $user = $this->userRepo->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $hashedPassword,
                'role' => 'tenant',
            ]);

            $cleanName = strtolower((string) preg_replace('/[^a-zA-Z0-9]/', '', $data['name']));
            if ($cleanName === '') {
                $cleanName = 'tenant';
            }
            $username = $cleanName . rand(100, 999);

            while ($this->tenantRepo->existsByUsername($username)) {
                $username = $cleanName . rand(100, 999);
            }

            $tenant = $this->tenantRepo->create([
                'user_id' => $user->id,
                'property_id' => $room->property_id,
                'room' => $room->room_number,
                'username' => $username,
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'password' => $hashedPassword,
                'status' => 'pending_approval',
                'balance' => 0.00,
                'water_rate' => 500.00,
            ]);

            $this->roomRepo->update($room->id, ['status' => 'reserved']);

            $inquiry = null;
            if (! empty($data['inquiry_id'])) {
                $candidate = $this->inquiryRepo->find((int) $data['inquiry_id']);
                if ($candidate && (int) $candidate->property_id === (int) $room->property_id && $candidate->isOpen()) {
                    $inquiry = $candidate;
                }
            }

            if (! $inquiry) {
                $inquiry = $this->inquiryRepo->findMatchingOpenForApplicant(
                    (int) $room->property_id,
                    (int) $room->id,
                    $data['email'] ?? null,
                    $data['phone'] ?? null
                );
            }

            if ($inquiry) {
                $this->inquiryRepo->update((int) $inquiry->id, [
                    'status' => 'converted',
                    'tenant_id' => $tenant->id,
                    'room_id' => $inquiry->room_id ?? $room->id,
                ]);
            }

            return $tenant;
        });

        Cache::forget('all_properties_with_counts');
        Cache::forget('admin_stats_all');
        Cache::forget("admin_stats_{$tenant->property_id}");

        return $tenant;
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
