<?php

namespace App\Http\Requests\Property;

use Illuminate\Foundation\Http\FormRequest;

class StorePropertyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:100'],
            'address' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:3000'],
            'contact_name' => ['nullable', 'string', 'max:100'],
            'contact_phone' => ['nullable', 'string', 'max:30'],
            'contact_email' => ['nullable', 'email', 'max:255'],
            'messenger_url' => ['nullable', 'string', 'max:255'],
            'house_rules' => ['nullable', 'string', 'max:3000'],
            'amenities' => ['nullable', 'array', 'max:25'],
            'amenities.*' => ['string', 'max:60'],
        ];
    }
}
