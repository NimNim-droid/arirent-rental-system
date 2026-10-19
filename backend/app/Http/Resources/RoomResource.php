<?php

namespace App\Http\Resources;

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
        return [
            'id' => (string) $this->id,
            'property_id' => (string) $this->property_id,
            'room_number' => $this->room_number,
            'rent' => (float) $this->rent,
            'status' => $this->status,
            'property' => $this->whenLoaded('property', fn () => [
                'id' => (string) $this->property->id,
                'name' => $this->property->name,
                'city' => $this->property->city,
                'address' => $this->property->address,
            ]),
        ];
    }
}
