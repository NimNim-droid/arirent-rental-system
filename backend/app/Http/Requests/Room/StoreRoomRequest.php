<?php

namespace App\Http\Requests\Room;

use Illuminate\Foundation\Http\FormRequest;

class StoreRoomRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'property_id' => ['required', 'exists:properties,id'],
            'room_number' => ['required', 'string', 'max:50'],
            'rent' => ['required', 'numeric', 'min:0'],
            'status' => ['nullable', 'in:vacant,reserved,occupied'],
            'description' => ['nullable', 'string', 'max:2000'],
            'capacity' => ['nullable', 'integer', 'min:1', 'max:20'],
            'floor_area' => ['nullable', 'numeric', 'min:1', 'max:1000'],
            'amenities' => ['nullable', 'array', 'max:25'],
            'amenities.*' => ['string', 'max:60'],
            'advance_months' => ['nullable', 'integer', 'min:0', 'max:12'],
            'deposit_months' => ['nullable', 'integer', 'min:0', 'max:12'],
            'is_listed' => ['nullable', 'boolean'],
        ];
    }
}
