<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('email')) {
            $this->merge([
                'email' => strtolower(trim((string) $this->email)),
            ]);
        }

        if ($this->has('property_id') && $this->property_id !== null && $this->property_id !== '') {
            $cleaned = (int) preg_replace('/[^0-9]/', '', (string) $this->property_id);
            $this->merge([
                'property_id' => $cleaned > 0 ? $cleaned : $this->property_id,
            ]);
        }

        if ($this->has('room_id') && $this->room_id !== null && $this->room_id !== '') {
            $cleanedRoom = (int) preg_replace('/[^0-9]/', '', (string) $this->room_id);
            $this->merge([
                'room_id' => $cleanedRoom > 0 ? $cleanedRoom : $this->room_id,
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email', 'unique:tenants,email'],
            'phone' => ['required', 'string', 'max:20'],
            'password' => ['required', 'string', 'confirmed', Password::min(12)->letters()->numbers()],
            'room_id' => ['nullable', 'integer', 'exists:rooms,id'],
            'property_id' => ['required_without:room_id', 'nullable', 'exists:properties,id'],
            'room_number' => ['required_without:room_id', 'nullable', 'string'],
            'inquiry_id' => ['nullable', 'integer', 'exists:inquiries,id'],
        ];
    }
}
