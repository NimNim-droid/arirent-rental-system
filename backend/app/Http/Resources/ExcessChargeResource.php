<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

class ExcessChargeResource extends JsonResource
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
            'bill_id' => $this->bill_id ? (string) $this->bill_id : null,
            'title' => $this->title,
            'description' => $this->description,
            'amount' => (float) $this->amount,
            'charge_date' => $this->charge_date ? Carbon::parse($this->charge_date)->format('Y-m-d') : null,
            'status' => $this->status,
            'created_at' => $this->created_at ? Carbon::parse($this->created_at)->format('Y-m-d H:i:s') : null,
        ];
    }
}
