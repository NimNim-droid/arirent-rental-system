<?php

namespace App\Services;

use App\Models\ExcessCharge;
use App\Models\User;
use App\Repositories\Contracts\ExcessChargeRepositoryInterface;
use App\Repositories\Contracts\TenantRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use InvalidArgumentException;

class ExcessChargeService
{
    public function __construct(
        protected ExcessChargeRepositoryInterface $excessChargeRepo,
        protected TenantRepositoryInterface $tenantRepo
    ) {}

    /**
     * List excess charges scoped by role and optional filters.
     */
    public function listCharges(User $user, array $filters = []): Collection
    {
        if ($user->role === 'tenant') {
            $tenant = $this->tenantRepo->findByUserIdOrEmail($user->id, $user->email);
            if (! $tenant) {
                return new Collection();
            }

            $filters = ['tenant_id' => $tenant->id];
        }

        return $this->excessChargeRepo->listWithRelations($filters);
    }

    /**
     * Create a new pending incidental/excess charge for a tenant.
     */
    public function createCharge(array $data): ExcessCharge
    {
        $charge = $this->excessChargeRepo->create([
            'tenant_id' => $data['tenant_id'],
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'amount' => $data['amount'],
            'charge_date' => $data['charge_date'],
            'status' => 'pending',
        ]);

        return $charge->load('tenant:id,name,room');
    }

    /**
     * Delete a pending excess charge. Billed charges cannot be removed.
     *
     * @throws ModelNotFoundException
     * @throws InvalidArgumentException
     */
    public function deleteCharge(int $id): bool
    {
        $charge = $this->excessChargeRepo->find($id);
        if (! $charge) {
            throw new ModelNotFoundException('Excess charge not found.');
        }

        if ($charge->status === 'billed') {
            throw new InvalidArgumentException(
                'Cannot delete an excess charge that has already been attached to a generated bill.'
            );
        }

        return $this->excessChargeRepo->delete($id);
    }
}

