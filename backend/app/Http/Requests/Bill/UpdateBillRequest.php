<?php

namespace App\Http\Requests\Bill;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBillRequest extends FormRequest
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
            'rent' => ['nullable', 'numeric', 'min:0'],
            'electricity' => ['nullable', 'numeric', 'min:0'],
            'elec_usage' => ['nullable', 'numeric', 'min:0'],
            'water' => ['nullable', 'numeric', 'min:0'],
            'late_fee' => ['nullable', 'numeric', 'min:0'],
            'due_date' => ['nullable', 'date'],
            'status' => ['nullable', 'in:unpaid,pending_verification,paid,voided'],
            'notes' => ['nullable', 'string'],
            'gcash_ref' => ['nullable', 'string', 'max:100'],
        ];
    }
}
