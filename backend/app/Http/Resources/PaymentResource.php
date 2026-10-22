<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

class PaymentResource extends JsonResource
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
            'bill_id' => (string) $this->bill_id,
            'tenant_id' => (string) $this->tenant_id,
            'amount' => (float) $this->amount,
            'payment_method' => $this->payment_method,
            'transaction_reference' => $this->transaction_reference,
            'status' => $this->status,
            'receipt_url' => $this->receipt_url,
            'paid_at' => $this->paid_at ? Carbon::parse($this->paid_at)->format('Y-m-d H:i:s') : null,
            'notes' => $this->notes,
            'created_at' => $this->created_at ? Carbon::parse($this->created_at)->format('Y-m-d H:i:s') : null,
        ];
    }
}
