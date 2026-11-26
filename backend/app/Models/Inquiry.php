<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Inquiry extends Model
{
    public const STATUS_NEW = 'new';
    public const STATUS_SCHEDULED = 'scheduled';
    public const STATUS_VISITED = 'visited';
    public const STATUS_CONVERTED = 'converted';
    public const STATUS_CANCELLED = 'cancelled';

    public const STATUSES = [
        self::STATUS_NEW,
        self::STATUS_SCHEDULED,
        self::STATUS_VISITED,
        self::STATUS_CONVERTED,
        self::STATUS_CANCELLED,
    ];

    /** Statuses that still need landlord follow-up. */
    public const OPEN_STATUSES = [
        self::STATUS_NEW,
        self::STATUS_SCHEDULED,
        self::STATUS_VISITED,
    ];

    public const PREFERRED_TIMES = ['morning', 'afternoon', 'evening'];

    protected $fillable = [
        'property_id',
        'room_id',
        'tenant_id',
        'name',
        'phone',
        'email',
        'preferred_date',
        'preferred_time',
        'message',
        'status',
        'scheduled_at',
        'admin_notes',
    ];

    protected function casts(): array
    {
        return [
            'preferred_date' => 'date',
            'scheduled_at' => 'datetime',
        ];
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function isOpen(): bool
    {
        return in_array($this->status, self::OPEN_STATUSES, true);
    }
}
