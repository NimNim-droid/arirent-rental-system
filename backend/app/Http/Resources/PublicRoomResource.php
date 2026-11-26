<?php

namespace App\Http\Resources;

use App\Support\PublicFile;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicRoomResource extends JsonResource
{
    /**
     * Strict public representation of a listed unit.
     * Never exposes occupant identity, lease dates, or ledger data.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $coverPath = $this->relationLoaded('photos')
            ? $this->photos->first()?->path
            : null;

        if (! $coverPath && $this->relationLoaded('property') && $this->property?->relationLoaded('photos')) {
            $coverPath = $this->property->photos->first()?->path;
        }

        $rent = (float) $this->rent;
        $advanceMonths = (int) ($this->advance_months ?? 1);
        $depositMonths = (int) ($this->deposit_months ?? 1);

        return [
            'id' => (string) $this->id,
            'property_id' => (string) $this->property_id,
            'room_number' => $this->room_number,
            'rent' => $rent,
            'status' => $this->status,
            'is_available' => $this->status === 'vacant' && $this->is_listed !== false,
            'description' => $this->description,
            'capacity' => (int) ($this->capacity ?? 1),
            'floor_area' => $this->floor_area !== null ? (float) $this->floor_area : null,
            'amenities' => $this->amenities ?? [],
            'advance_months' => $advanceMonths,
            'deposit_months' => $depositMonths,
            'move_in_total' => round($rent * max(1, $advanceMonths + $depositMonths), 2),
            'cover_photo_url' => PublicFile::url($coverPath),
            'photos' => ListingPhotoResource::collection($this->whenLoaded('photos')),
            'property' => $this->whenLoaded('property', function () {
                $propCover = $this->property->relationLoaded('photos')
                    ? $this->property->photos->first()?->path
                    : null;

                return [
                    'id' => (string) $this->property->id,
                    'name' => $this->property->name,
                    'city' => $this->property->city,
                    'address' => $this->property->address,
                    'description' => $this->property->description,
                    'contact_name' => $this->property->contact_name,
                    'contact_phone' => $this->property->contact_phone,
                    'contact_email' => $this->property->contact_email,
                    'messenger_url' => $this->property->messenger_url,
                    'house_rules' => $this->property->house_rules,
                    'amenities' => $this->property->amenities ?? [],
                    'cover_photo_url' => PublicFile::url($propCover),
                    'photos' => ListingPhotoResource::collection(
                        $this->property->relationLoaded('photos') ? $this->property->photos : collect()
                    ),
                    'other_available_rooms' => $this->property->relationLoaded('rooms')
                        ? $this->property->rooms
                            ->where('id', '!=', $this->id)
                            ->values()
                            ->map(fn ($sibling) => [
                                'id' => (string) $sibling->id,
                                'room_number' => $sibling->room_number,
                                'rent' => (float) $sibling->rent,
                                'capacity' => (int) ($sibling->capacity ?? 1),
                                'floor_area' => $sibling->floor_area !== null ? (float) $sibling->floor_area : null,
                                'cover_photo_url' => PublicFile::url(
                                    $sibling->relationLoaded('photos') ? $sibling->photos->first()?->path : null
                                ),
                            ])
                        : [],
                ];
            }),
        ];
    }
}
