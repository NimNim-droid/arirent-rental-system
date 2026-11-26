<?php

namespace App\Http\Resources;

use App\Support\PublicFile;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RoomResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $coverPath = $this->relationLoaded('photos')
            ? $this->photos->first()?->path
            : null;

        return [
            'id' => (string) $this->id,
            'property_id' => (string) $this->property_id,
            'room_number' => $this->room_number,
            'rent' => (float) $this->rent,
            'status' => $this->status,
            'description' => $this->description,
            'capacity' => (int) ($this->capacity ?? 1),
            'floor_area' => $this->floor_area !== null ? (float) $this->floor_area : null,
            'amenities' => $this->amenities ?? [],
            'advance_months' => (int) ($this->advance_months ?? 1),
            'deposit_months' => (int) ($this->deposit_months ?? 1),
            'is_listed' => $this->is_listed !== false,
            'cover_photo_url' => PublicFile::url($coverPath),
            'photos' => ListingPhotoResource::collection($this->whenLoaded('photos')),
            'property' => $this->whenLoaded('property', fn () => [
                'id' => (string) $this->property->id,
                'name' => $this->property->name,
                'city' => $this->property->city,
                'address' => $this->property->address,
            ]),
        ];
    }
}
