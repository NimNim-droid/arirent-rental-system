<?php

namespace App\Http\Resources;

use App\Support\PrivateFile;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SettingsResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'elec_rate' => (float) $this->elec_rate,
            'water_rate' => (float) $this->water_rate,
            'gcash_name' => $this->gcash_name,
            'gcash_number' => $this->gcash_number,
            'gcash_qr_path' => PrivateFile::url($this->gcash_qr_path),
        ];
    }
}
