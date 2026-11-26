<?php

namespace App\Services;

use App\Exceptions\DomainException;
use App\Models\Inquiry;
use App\Repositories\Contracts\InquiryRepositoryInterface;
use App\Repositories\Contracts\PropertyRepositoryInterface;
use App\Repositories\Contracts\RoomRepositoryInterface;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Cache;

class InquiryService
{
    public function __construct(
        protected InquiryRepositoryInterface $inquiryRepo,
        protected PropertyRepositoryInterface $propertyRepo,
        protected RoomRepositoryInterface $roomRepo
    ) {}

    /**
     * Submit a public visit/viewing inquiry without reserving the room.
     *
     * @throws ModelNotFoundException
     * @throws DomainException
     */
    public function submitInquiry(array $data): Inquiry
    {
        $property = $this->propertyRepo->find((int) $data['property_id']);
        if (! $property) {
            throw new ModelNotFoundException('Property not found.');
        }

        $roomId = isset($data['room_id']) && $data['room_id'] !== null ? (int) $data['room_id'] : null;

        if ($roomId !== null) {
            $room = $this->roomRepo->find($roomId);
            if (! $room || (int) $room->property_id !== (int) $property->id) {
                throw new DomainException('The selected room does not belong to this property.', 422);
            }
            if ($room->is_listed === false) {
                throw new DomainException('This unit is not currently open for public viewing inquiries.', 422);
            }
        }

        $inquiry = $this->inquiryRepo->create([
            'property_id' => $property->id,
            'room_id' => $roomId,
            'name' => trim((string) $data['name']),
            'phone' => trim((string) $data['phone']),
            'email' => $data['email'] ?? null,
            'preferred_date' => $data['preferred_date'] ?? null,
            'preferred_time' => $data['preferred_time'] ?? null,
            'message' => isset($data['message']) ? trim((string) $data['message']) : null,
            'status' => 'new',
        ]);

        $this->invalidateDashboardCache((int) $property->id);

        return $inquiry;
    }

    /**
     * Paginate inquiries for admin inbox along with status tab counts.
     *
     * @return array{paginator: \Illuminate\Contracts\Pagination\LengthAwarePaginator, status_counts: array<string, int>}
     */
    public function listInquiries(array $filters = [], int $perPage = 50): array
    {
        $propertyId = ! empty($filters['property_id']) ? (int) $filters['property_id'] : null;

        return [
            'paginator' => $this->inquiryRepo->paginate($perPage, $filters),
            'status_counts' => $this->inquiryRepo->getStatusCounts($propertyId),
        ];
    }

    /**
     * Show a single inquiry with linked building, room, and converted tenant.
     *
     * @throws ModelNotFoundException
     */
    public function getInquiry(int $id): Inquiry
    {
        $inquiry = $this->inquiryRepo->find($id, [
            'property:id,name,city,address',
            'room:id,property_id,room_number,rent,status',
            'tenant:id,name,status,room',
        ]);

        if (! $inquiry) {
            throw new ModelNotFoundException('Inquiry not found.');
        }

        return $inquiry;
    }

    /**
     * Update inquiry status, confirmed visit schedule, or admin notes.
     *
     * @throws ModelNotFoundException
     */
    public function updateInquiry(int $id, array $data): Inquiry
    {
        $existing = $this->inquiryRepo->find($id);
        if (! $existing) {
            throw new ModelNotFoundException('Inquiry not found.');
        }

        // Automatically advance 'new' -> 'scheduled' when a visit timestamp is set without an explicit status
        if (! isset($data['status']) && ! empty($data['scheduled_at']) && $existing->status === 'new') {
            $data['status'] = 'scheduled';
        }

        $updated = $this->inquiryRepo->update($id, $data);
        $this->invalidateDashboardCache((int) $updated->property_id);

        return $updated;
    }

    /**
     * Delete an inquiry record.
     *
     * @throws ModelNotFoundException
     */
    public function deleteInquiry(int $id): void
    {
        $existing = $this->inquiryRepo->find($id);
        if (! $existing) {
            throw new ModelNotFoundException('Inquiry not found.');
        }

        $propertyId = (int) $existing->property_id;
        $this->inquiryRepo->delete($id);
        $this->invalidateDashboardCache($propertyId);
    }

    protected function invalidateDashboardCache(int $propertyId): void
    {
        Cache::forget('admin_stats_all');
        Cache::forget("admin_stats_{$propertyId}");
    }
}
