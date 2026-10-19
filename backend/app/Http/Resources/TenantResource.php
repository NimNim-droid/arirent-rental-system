<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

class TenantResource extends JsonResource
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
            'username' => $this->username,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'property_id' => (string) $this->property_id,
            'property_name' => $this->property?->name,
            'property_address' => $this->property?->address,
            'room' => $this->room,
            'room_rent' => (float) ($this->room_rent ?? 0.00),
            'latest_reading' => (float) ($this->latest_reading ?? 0.00),
            'status' => $this->status,
            'balance' => (float) $this->balance,
            'water_rate' => (float) $this->water_rate,
            'move_in_date' => $this->move_in_date ? Carbon::parse($this->move_in_date)->format('Y-m-d') : ($this->created_at ? Carbon::parse($this->created_at)->format('Y-m-d') : null),
            'billing_day' => method_exists($this->resource, 'getBillingDay') ? $this->getBillingDay() : (int) Carbon::parse($this->move_in_date ?? $this->created_at ?? now())->day,
            'advance_paid' => (float) $this->advance_paid,
            'lease_end' => $this->lease_end ? Carbon::parse($this->lease_end)->format('Y-m-d') : null,
            'vacated_date' => $this->vacated_date ? Carbon::parse($this->vacated_date)->format('Y-m-d H:i:s') : null,
            'created_at' => $this->created_at ? Carbon::parse($this->created_at)->format('Y-m-d H:i:s') : null,
        ];
    }
}
