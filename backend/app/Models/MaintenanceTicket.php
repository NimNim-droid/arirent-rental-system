<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaintenanceTicket extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'property_id',
        'room',
        'type',
        'description',
        'photo_url',
        'priority',
        'status',
        'technician_name',
        'admin_notes',
        'resolved_date',
    ];

    protected function casts(): array
    {
        return [
            'resolved_date' => 'datetime',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }
}
