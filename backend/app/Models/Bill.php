<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Bill extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'rent',
        'electricity',
        'elec_usage',
        'water',
        'late_fee',
        'total_amount',
        'paid_amount',
        'remaining_balance',
        'date',
        'due_date',
        'status',
        'gcash_ref',
        'receipt_url',
        'notes',
        'payment_date',
        'approved_date',
        'reject_reason',
    ];

    protected function casts(): array
    {
        return [
            'rent' => 'decimal:2',
            'electricity' => 'decimal:2',
            'elec_usage' => 'decimal:2',
            'water' => 'decimal:2',
            'late_fee' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'remaining_balance' => 'decimal:2',
            'date' => 'date',
            'due_date' => 'date',
            'payment_date' => 'datetime',
            'approved_date' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Bill $bill) {
            $total = (float) ($bill->total_amount ?? 0);
            $paid = (float) ($bill->paid_amount ?? 0);
            if ($bill->remaining_balance === null || (float) $bill->remaining_balance === 0.00 && $paid === 0.00 && $total > 0) {
                $bill->remaining_balance = max(0.00, $total - $paid);
            }
            if ($bill->paid_amount === null) {
                $bill->paid_amount = 0.00;
            }
        });
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function readings(): HasMany
    {
        return $this->hasMany(UtilityReading::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function excessCharges(): HasMany
    {
        return $this->hasMany(ExcessCharge::class);
    }
}
