<?php

namespace App\Http\Resources;

use App\Support\PublicFile;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicPropertyResource extends JsonResource
{
    /**
     * Strict public representation of a property listing.
     * Never exposes tenant records, financial balances, or unlisted units.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $coverPath = $this->relationLoaded('photos')
            ? $this->photos->first()?->path
            : null;

        if (! $coverPath && $this->relationLoaded('rooms')) {
            foreach ($this->rooms as $room) {
                if ($room->relationLoaded('photos') && $room->photos->isNotEmpty()) {
                    $coverPath = $room->photos->first()->path;
                    break;
                }
            }
        }

        $listedRoomsCount = $this->listed_rooms_count
            ?? ($this->relationLoaded('rooms') ? $this->rooms->count() : 0);

        $availableRoomsCount = $this->available_rooms_count
            ?? ($this->relationLoaded('rooms') ? $this->rooms->where('status', 'vacant')->count() : 0);

        $startingRent = $this->starting_rent;
        if ($startingRent === null && $this->relationLoaded('rooms')) {
            $vacantMin = $this->rooms->where('status', 'vacant')->min('rent');
            $startingRent = $vacantMin ?? $this->rooms->min('rent');
        }

        return [
            'id' => (string) $this->id,
            'name' => $this->name,
            'city' => $this->city,
            'address' => $this->address,
            'description' => $this->description,
            'contact_name' => $this->contact_name,
            'contact_phone' => $this->contact_phone,
            'contact_email' => $this->contact_email,
            'messenger_url' => $this->messenger_url,
            'house_rules' => $this->house_rules,
            'amenities' => $this->amenities ?? [],
            'listed_rooms_count' => (int) $listedRoomsCount,
            'available_rooms_count' => (int) $availableRoomsCount,
            'starting_rent' => $startingRent !== null ? (float) $startingRent : null,
            'cover_photo_url' => PublicFile::url($coverPath),
            'photos' => ListingPhotoResource::collection($this->whenLoaded('photos')),
            'rooms' => PublicRoomResource::collection($this->whenLoaded('rooms')),
        ];
    }
}
