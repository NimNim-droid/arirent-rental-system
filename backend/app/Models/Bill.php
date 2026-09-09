<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
            'date' => 'date',
            'due_date' => 'date',
            'payment_date' => 'datetime',
            'approved_date' => 'datetime',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
