<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory;

    protected $fillable = [
        'elec_rate',
        'water_rate',
        'gcash_name',
        'gcash_number',
        'gcash_qr_path',
    ];

    protected function casts(): array
    {
        return [
            'elec_rate' => 'decimal:2',
            'water_rate' => 'decimal:2',
        ];
    }

    protected static function booted(): void
    {
        static::saved(fn () => \Illuminate\Support\Facades\Cache::forget('global_settings'));
        static::deleted(fn () => \Illuminate\Support\Facades\Cache::forget('global_settings'));
    }

    public static function getGlobal(): self
    {
        return \Illuminate\Support\Facades\Cache::rememberForever('global_settings', function () {
            return static::firstOrCreate([], [
                'elec_rate' => 12.50,
                'water_rate' => 500.00,
                'gcash_name' => 'AriRent Property Management',
                'gcash_number' => '0917-123-4567',
                'gcash_qr_path' => null,
            ]);
        });
    }
}
