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
}
