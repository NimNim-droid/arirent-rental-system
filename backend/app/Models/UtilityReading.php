<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UtilityReading extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'prev_reading',
        'curr_reading',
        'usage_kwh',
        'amount',
        'date',
    ];

    protected function casts(): array
    {
        return [
            'prev_reading' => 'decimal:2',
            'curr_reading' => 'decimal:2',
            'usage_kwh' => 'decimal:2',
            'amount' => 'decimal:2',
            'date' => 'date',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
