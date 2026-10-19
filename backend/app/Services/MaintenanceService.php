<?php

namespace App\Services;

use App\Models\MaintenanceTicket;
use App\Models\User;
use App\Repositories\Contracts\MaintenanceRepositoryInterface;
use App\Repositories\Contracts\TenantRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\UploadedFile;
use InvalidArgumentException;

class MaintenanceService
{
    public function __construct(
        protected MaintenanceRepositoryInterface $maintenanceRepo,
        protected TenantRepositoryInterface $tenantRepo
    ) {}

    /**
     * List maintenance tickets scoped by user role and filters.
     */
    public function listTickets(User $user, array $filters = [], int $perPage = 50): LengthAwarePaginator
    {
        if ($user->role === 'tenant') {
            $tenant = $this->tenantRepo->findByUserIdOrEmail($user->id, $user->email);

            if (! $tenant) {
                return new \Illuminate\Pagination\LengthAwarePaginator([], 0, min($perPage, 250));
            }

            $filters = ['tenant_id' => $tenant->id];
        }

        return $this->maintenanceRepo->paginate($perPage, $filters);
    }

    /**
     * Submit a new maintenance ticket.
     */
    public function createTicket(User $user, array $data, ?UploadedFile $photoFile = null): MaintenanceTicket
    {
        if ($user->role === 'tenant') {
            $activeTenant = $this->tenantRepo->findByUserIdOrEmail($user->id, $user->email);
            if (! $activeTenant) {
                throw new InvalidArgumentException('Tenant profile required to submit ticket.');
            }
        } else {
            $tenantId = $data['tenant_id'] ?? null;
            if ($tenantId) {
                $activeTenant = $this->tenantRepo->find($tenantId);
                if (! $activeTenant) {
                    throw new ModelNotFoundException('Tenant not found.');
                }
            } else {
                $activeTenant = $this->tenantRepo->findByUserIdOrEmail($user->id, $user->email);
                if (! $activeTenant) {
                    throw new InvalidArgumentException('Tenant profile required to submit ticket.');
                }
            }
        }

        $photoUrl = $data['photo_url'] ?? null;
        if ($photoFile) {
            $path = $photoFile->store('maintenance', 'public');
            $photoUrl = '/storage/' . $path;
        }

        return $this->maintenanceRepo->create([
            'tenant_id' => $activeTenant->id,
            'property_id' => $activeTenant->property_id,
            'room' => $activeTenant->room,
            'type' => $data['type'],
            'description' => $data['description'],
            'priority' => $data['priority'],
            'photo_url' => $photoUrl,
            'status' => 'pending',
        ]);
    }

    /**
     * Update ticket status, technician, or resolution details.
     */
    public function updateTicket(int $id, array $data): MaintenanceTicket
    {
        $ticket = $this->maintenanceRepo->find($id);

        if (! $ticket) {
            throw new ModelNotFoundException('Ticket not found.');
        }

        if (isset($data['status']) && $data['status'] === 'resolved' && ! $ticket->resolved_date) {
            $data['resolved_date'] = now();
        }

        return $this->maintenanceRepo->update($id, $data);
    }

    /**
     * Delete a maintenance ticket.
     */
    public function deleteTicket(int $id): bool
    {
        $ticket = $this->maintenanceRepo->find($id);

        if (! $ticket) {
            throw new ModelNotFoundException('Ticket not found.');
        }

        return $this->maintenanceRepo->delete($id);
    }
}
