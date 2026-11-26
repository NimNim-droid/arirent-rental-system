<?php

namespace App\Http\Requests\Inquiry;

use App\Models\Inquiry;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateInquiryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'status' => ['sometimes', 'required', 'string', Rule::in(Inquiry::STATUSES)],
            'scheduled_at' => ['nullable', 'date'],
            'admin_notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
