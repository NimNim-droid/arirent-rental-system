<?php

namespace App\Http\Requests\Bill;

use Illuminate\Foundation\Http\FormRequest;

class StoreBillRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'tenant_id' => ['required', 'exists:tenants,id'],
            'rent' => ['required', 'numeric', 'min:0'],
            'electricity' => ['nullable', 'numeric', 'min:0'],
            'elec_usage' => ['nullable', 'numeric', 'min:0'],
            'water' => ['nullable', 'numeric', 'min:0'],
            'late_fee' => ['nullable', 'numeric', 'min:0'],
            'date' => ['required', 'date'],
            'due_date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
            'prev_reading' => ['nullable', 'numeric', 'min:0'],
            'curr_reading' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
