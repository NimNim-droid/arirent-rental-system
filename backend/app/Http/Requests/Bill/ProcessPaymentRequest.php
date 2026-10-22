<?php

namespace App\Http\Requests\Bill;

use App\Repositories\Contracts\BillRepositoryInterface;
use App\Repositories\Contracts\TenantRepositoryInterface;
use Illuminate\Foundation\Http\FormRequest;

class ProcessPaymentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();
        if (! $user) {
            return false;
        }

        if ($user->role === 'admin') {
            return true;
        }

        if ($user->role === 'tenant') {
            $billId = (int) $this->route('id');
            $bill = app(BillRepositoryInterface::class)->find($billId);
            if (! $bill) {
                return false;
            }

            $tenant = app(TenantRepositoryInterface::class)->findByUserIdOrEmail($user->id, $user->email);

            return $tenant && $bill->tenant_id === $tenant->id;
        }

        return false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'amount' => ['nullable', 'numeric', 'min:1'],
            'payment_method' => ['nullable', 'string', 'in:gcash,card,cash,bank_transfer'],
            'gcash_ref' => ['required', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:500'],
            'receipt' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,svg,pdf,heic,heif', 'max:10240'],
        ];
    }

    /**
     * Get custom error messages for validation rules.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'gcash_ref.required' => 'The GCash reference number is required.',
            'receipt.mimes' => 'The receipt must be an image (JPG, PNG, WebP, SVG) or PDF file.',
            'receipt.max' => 'The receipt file must not exceed 10MB.',
        ];
    }
}
