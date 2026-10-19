<?php

namespace App\Http\Resources;

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
        return [
            'id' => (string) $this->id,
            'name' => $this->name,
            'city' => $this->city,
            'address' => $this->address,
            'rooms_count' => (int) ($this->rooms_count ?? ($this->relationLoaded('rooms') ? $this->rooms->count() : 0)),
            'occupied_count' => (int) ($this->occupied_count ?? ($this->relationLoaded('rooms') ? $this->rooms->where('status', 'occupied')->count() : 0)),
            'rooms' => RoomResource::collection($this->whenLoaded('rooms')),
        ];
    }
}
