<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class ChangePasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'confirmed', 'different:current_password', Password::min(12)->letters()->numbers()],
        ];
    }

    public function messages(): array
    {
        return [
            'current_password.required' => 'Enter your current password.',
            'password.confirmed' => 'The new password confirmation does not match.',
            'password.different' => 'The new password must be different from your current password.',
        ];
    }
}
