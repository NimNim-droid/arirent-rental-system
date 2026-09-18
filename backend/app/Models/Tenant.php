<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tenant extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'property_id',
        'room',
        'username',
        'name',
        'email',
        'phone',
        'password',
        'status',
        'balance',
        'water_rate',
        'move_in_date',
        'advance_paid',
        'lease_end',
        'vacated_date',
    ];

    protected $hidden = [
        'password',
    ];

    protected function casts(): array
    {
        return [
            'balance' => 'decimal:2',
            'water_rate' => 'decimal:2',
            'advance_paid' => 'decimal:2',
            'move_in_date' => 'date',
            'lease_end' => 'date',
            'vacated_date' => 'datetime',
        ];
    }

    /**
     * Get the day of the month when this tenant's rent is due.
     */
    public function getBillingDay(): int
    {
        $date = $this->move_in_date ?? $this->created_at ?? now();
        return (int) \Carbon\Carbon::parse($date)->day;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function bills(): HasMany
    {
        return $this->hasMany(Bill::class);
    }

    public function utilityReadings(): HasMany
    {
        return $this->hasMany(UtilityReading::class);
    }

    public function maintenanceTickets(): HasMany
    {
        return $this->hasMany(MaintenanceTicket::class);
    }
}
