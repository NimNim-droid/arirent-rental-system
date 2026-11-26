<?php

namespace App\Http\Resources;

use App\Support\PublicFile;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PropertyResource extends JsonResource
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
            'rooms_count' => (int) ($this->rooms_count ?? ($this->relationLoaded('rooms') ? $this->rooms->count() : 0)),
            'occupied_count' => (int) ($this->occupied_count ?? ($this->relationLoaded('rooms') ? $this->rooms->where('status', 'occupied')->count() : 0)),
            'listed_rooms_count' => (int) ($this->listed_rooms_count ?? ($this->relationLoaded('rooms') ? $this->rooms->where('is_listed', true)->count() : 0)),
            'available_rooms_count' => (int) ($this->available_rooms_count ?? ($this->relationLoaded('rooms') ? $this->rooms->where('is_listed', true)->where('status', 'vacant')->count() : 0)),
            'cover_photo_url' => PublicFile::url($coverPath),
            'photos' => ListingPhotoResource::collection($this->whenLoaded('photos')),
            'rooms' => RoomResource::collection($this->whenLoaded('rooms')),
        ];
    }
}
