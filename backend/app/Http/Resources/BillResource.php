<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

class BillResource extends JsonResource
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
            'rent' => (float) $this->rent,
            'electricity' => (float) $this->electricity,
            'elec_usage' => (float) $this->elec_usage,
            'water' => (float) $this->water,
            'late_fee' => (float) $this->late_fee,
            'total_amount' => (float) $this->total_amount,
            'paid_amount' => (float) ($this->paid_amount ?? 0),
            'remaining_balance' => (float) ($this->remaining_balance ?? $this->total_amount),
            'date' => $this->date ? Carbon::parse($this->date)->format('Y-m-d') : null,
            'due_date' => $this->due_date ? Carbon::parse($this->due_date)->format('Y-m-d') : null,
            'status' => $this->status,
            'gcash_ref' => $this->gcash_ref,
            'receipt_url' => $this->receipt_url,
            'notes' => $this->notes,
            'payment_date' => $this->payment_date ? Carbon::parse($this->payment_date)->format('Y-m-d H:i:s') : null,
            'approved_date' => $this->approved_date ? Carbon::parse($this->approved_date)->format('Y-m-d H:i:s') : null,
            'reject_reason' => $this->reject_reason,
            'tenant' => $this->whenLoaded('tenant', fn () => [
                'name' => $this->tenant->name,
                'room' => $this->tenant->room,
            ]),
            'payments' => PaymentResource::collection($this->whenLoaded('payments')),
            'excess_charges' => ExcessChargeResource::collection($this->whenLoaded('excessCharges')),
            'readings' => ReadingResource::collection($this->whenLoaded('readings')),
        ];
    }
}
