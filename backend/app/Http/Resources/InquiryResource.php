<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InquiryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'property_id' => (string) $this->property_id,
            'room_id' => $this->room_id ? (string) $this->room_id : null,
            'tenant_id' => $this->tenant_id ? (string) $this->tenant_id : null,
            'name' => $this->name,
            'phone' => $this->phone,
            'email' => $this->email,
            'preferred_date' => $this->preferred_date?->format('Y-m-d'),
            'preferred_time' => $this->preferred_time,
            'message' => $this->message,
            'status' => $this->status,
            'scheduled_at' => $this->scheduled_at?->toIso8601String(),
            'admin_notes' => $this->admin_notes,
            'created_at' => $this->created_at?->toIso8601String(),
            'property' => $this->whenLoaded('property', fn () => $this->property ? [
                'id' => (string) $this->property->id,
                'name' => $this->property->name,
                'city' => $this->property->city,
                'address' => $this->property->address,
            ] : null),
            'room' => $this->whenLoaded('room', fn () => $this->room ? [
                'id' => (string) $this->room->id,
                'room_number' => $this->room->room_number,
                'rent' => (float) $this->room->rent,
                'status' => $this->room->status,
            ] : null),
            'tenant' => $this->whenLoaded('tenant', fn () => $this->tenant ? [
                'id' => (string) $this->tenant->id,
                'name' => $this->tenant->name,
                'status' => $this->tenant->status,
                'room' => $this->tenant->room,
            ] : null),
        ];
    }
}
