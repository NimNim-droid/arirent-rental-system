<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

class ReadingResource extends JsonResource
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
            'tenant_id' => (string) $this->tenant_id,
            'tenant_name' => $this->tenant?->name,
            'room' => $this->tenant?->room,
            'property_name' => $this->tenant?->property?->name,
            'prev_reading' => (float) $this->prev_reading,
            'curr_reading' => (float) $this->curr_reading,
            'usage_kwh' => (float) $this->usage_kwh,
            'amount' => (float) $this->amount,
            'meter_photo_url' => $this->meter_photo_url,
            'type' => $this->type ?? 'electricity',
            'date' => $this->date ? Carbon::parse($this->date)->format('Y-m-d') : null,
        ];
    }
}
