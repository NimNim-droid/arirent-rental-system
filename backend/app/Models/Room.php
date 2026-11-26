<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Room extends Model
{
    use HasFactory;

    protected $fillable = [
        'property_id',
        'room_number',
        'rent',
        'status',
        'description',
        'capacity',
        'floor_area',
        'amenities',
        'advance_months',
        'deposit_months',
        'is_listed',
    ];

    protected function casts(): array
    {
        return [
            'rent' => 'decimal:2',
            'floor_area' => 'decimal:2',
            'amenities' => 'array',
            'capacity' => 'integer',
            'advance_months' => 'integer',
            'deposit_months' => 'integer',
            'is_listed' => 'boolean',
        ];
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function photos(): HasMany
    {
        return $this->hasMany(ListingPhoto::class)
            ->orderBy('sort_order')
            ->orderBy('id');
    }

    /**
     * A room can be applied for only when it is published and nobody holds it.
     */
    public function isAvailableForApplication(): bool
    {
        return $this->is_listed && $this->status === 'vacant';
    }
}
