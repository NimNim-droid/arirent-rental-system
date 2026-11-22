<?php

namespace App\Http\Requests\Bill;

use App\Repositories\Contracts\BillRepositoryInterface;
use App\Repositories\Contracts\TenantRepositoryInterface;
use Illuminate\Foundation\Http\FormRequest;

class XenditCheckoutRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to create a checkout session for this bill.
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
                return true; // Let controller return 404
            }

            $tenant = app(TenantRepositoryInterface::class)->findByUserIdOrEmail($user->id, $user->email);

            return $tenant && (int) $bill->tenant_id === (int) $tenant->id;
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
            'redirect_origin' => ['nullable', 'string', 'max:255'],
            'preferred_method' => ['nullable', 'string', 'in:gcash,maya,bank_transfer,card,qrph'],
        ];
    }
}
