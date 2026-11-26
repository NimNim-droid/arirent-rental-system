<?php

namespace App\Http\Requests\Inquiry;

use App\Models\Inquiry;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInquiryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('email') && $this->email !== null) {
            $trimmed = strtolower(trim((string) $this->email));
            $this->merge(['email' => $trimmed !== '' ? $trimmed : null]);
        }
    }

    public function rules(): array
    {
        return [
            'property_id' => ['required', 'integer', 'exists:properties,id'],
            'room_id' => ['nullable', 'integer', 'exists:rooms,id'],
            'name' => ['required', 'string', 'max:100'],
            'phone' => ['required', 'string', 'max:30'],
            'email' => ['nullable', 'string', 'email', 'max:255'],
            'preferred_date' => ['nullable', 'date', 'after_or_equal:today'],
            'preferred_time' => ['nullable', 'string', Rule::in(Inquiry::PREFERRED_TIMES)],
            'message' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
