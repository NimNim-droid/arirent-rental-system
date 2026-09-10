<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('property_id')) {
            $cleaned = (int) preg_replace('/[^0-9]/', '', (string) $this->property_id);
            $this->merge([
                'property_id' => $cleaned > 0 ? $cleaned : $this->property_id,
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email', 'unique:tenants,email'],
            'phone' => ['required', 'string', 'max:20'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
            'property_id' => ['required', 'exists:properties,id'],
            'room_number' => ['required', 'string'],
        ];
    }
}
