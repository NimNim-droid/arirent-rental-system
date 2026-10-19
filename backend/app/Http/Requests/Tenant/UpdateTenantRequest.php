<?php

namespace App\Http\Requests\Tenant;

use App\Models\Tenant;
use Illuminate\Foundation\Http\FormRequest;

class UpdateTenantRequest extends FormRequest
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
            $tenantId = (int) $this->route('id');
            $tenant = Tenant::find($tenantId);
            return $tenant && ($tenant->user_id === $user->id || $tenant->email === $user->email);
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
        if ($this->user()?->role === 'tenant') {
            return [
                'phone' => ['nullable', 'string', 'max:20'],
            ];
        }

        return [
            'name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'water_rate' => ['nullable', 'numeric', 'min:0'],
            'balance' => ['nullable', 'numeric'],
            'lease_end' => ['nullable', 'date'],
            'move_in_date' => ['nullable', 'date'],
            'advance_paid' => ['nullable', 'numeric', 'min:0'],
            'room' => ['nullable', 'string', 'max:50'],
        ];
    }
}
