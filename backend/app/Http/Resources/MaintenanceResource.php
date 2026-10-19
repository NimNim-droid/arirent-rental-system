<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

class MaintenanceResource extends JsonResource
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
            'property_id' => (string) $this->property_id,
            'property_name' => $this->tenant?->property?->name,
            'room' => $this->room,
            'type' => $this->type,
            'description' => $this->description,
            'photo_url' => $this->photo_url,
            'priority' => $this->priority,
            'status' => $this->status,
            'technician_name' => $this->technician_name,
            'admin_notes' => $this->admin_notes,
            'resolved_date' => $this->resolved_date ? Carbon::parse($this->resolved_date)->format('Y-m-d H:i:s') : null,
            'date' => $this->created_at ? Carbon::parse($this->created_at)->format('Y-m-d') : null,
            'created_at' => $this->created_at ? Carbon::parse($this->created_at)->format('Y-m-d H:i:s') : null,
        ];
    }
}
