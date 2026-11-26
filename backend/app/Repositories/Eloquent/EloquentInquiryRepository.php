<?php

namespace App\Repositories\Eloquent;

use App\Models\Inquiry;
use App\Repositories\Contracts\InquiryRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class EloquentInquiryRepository implements InquiryRepositoryInterface
{
    public function paginate(int $perPage = 50, array $filters = []): LengthAwarePaginator
    {
        $query = Inquiry::with([
            'property:id,name,city,address',
            'room:id,property_id,room_number,rent,status',
            'tenant:id,name,status,room',
        ]);

        if (! empty($filters['property_id'])) {
            $query->where('property_id', (int) $filters['property_id']);
        }

        if (! empty($filters['status']) && $filters['status'] !== 'all') {
            if ($filters['status'] === 'open') {
                $query->whereIn('status', Inquiry::OPEN_STATUSES);
            } else {
                $query->where('status', $filters['status']);
            }
        }

        if (! empty($filters['search'])) {
            $term = '%' . mb_strtolower(trim((string) $filters['search'])) . '%';
            $query->where(function (Builder $q) use ($term) {
                $q->whereRaw('LOWER(name) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(phone) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(COALESCE(email, \'\')) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(COALESCE(message, \'\')) LIKE ?', [$term]);
            });
        }

        return $query
            ->orderByRaw("CASE status WHEN 'new' THEN 0 WHEN 'scheduled' THEN 1 WHEN 'visited' THEN 2 WHEN 'converted' THEN 3 ELSE 4 END")
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    public function find(int $id, array $relations = []): ?Inquiry
    {
        $query = Inquiry::query();
        if (! empty($relations)) {
            $query->with($relations);
        }

        return $query->find($id);
    }

    public function create(array $attributes): Inquiry
    {
        return Inquiry::create($attributes)->load([
            'property:id,name,city,address',
            'room:id,property_id,room_number,rent,status',
        ]);
    }

    public function update(int $id, array $attributes): Inquiry
    {
        $inquiry = Inquiry::findOrFail($id);
        $inquiry->update($attributes);

        return $inquiry->load([
            'property:id,name,city,address',
            'room:id,property_id,room_number,rent,status',
            'tenant:id,name,status,room',
        ]);
    }

    public function delete(int $id): bool
    {
        $inquiry = Inquiry::find($id);

        return $inquiry ? (bool) $inquiry->delete() : false;
    }

    public function getStatusCounts(?int $propertyId = null): array
    {
        $rows = Inquiry::query()
            ->when($propertyId, fn ($q) => $q->where('property_id', $propertyId))
            ->selectRaw('status, count(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        $counts = [];
        foreach (Inquiry::STATUSES as $status) {
            $counts[$status] = (int) ($rows[$status] ?? 0);
        }

        return $counts;
    }

    public function countNew(?int $propertyId = null): int
    {
        return Inquiry::query()
            ->when($propertyId, fn ($q) => $q->where('property_id', $propertyId))
            ->where('status', Inquiry::STATUS_NEW)
            ->count();
    }

    public function findMatchingOpenForApplicant(
        int $propertyId,
        ?int $roomId,
        ?string $email,
        ?string $phone
    ): ?Inquiry {
        $normalizedEmail = $email ? strtolower(trim($email)) : null;
        $normalizedPhone = $phone ? preg_replace('/[^0-9]/', '', $phone) : null;

        if (! $normalizedEmail && ! $normalizedPhone) {
            return null;
        }

        return Inquiry::where('property_id', $propertyId)
            ->whereIn('status', Inquiry::OPEN_STATUSES)
            ->where(function (Builder $q) use ($normalizedEmail, $normalizedPhone) {
                if ($normalizedEmail) {
                    $q->orWhereRaw('LOWER(email) = ?', [$normalizedEmail]);
                }
                if ($normalizedPhone && strlen($normalizedPhone) >= 7) {
                    $tail = substr($normalizedPhone, -9);
                    $q->orWhere('phone', 'LIKE', '%' . $tail . '%');
                }
            })
            ->when($roomId, fn (Builder $q) => $q->orderByRaw('CASE WHEN room_id = ? THEN 0 ELSE 1 END', [$roomId]))
            ->latest()
            ->first();
    }
}
