<?php

namespace App\Http\Resources;

use App\Support\PublicFile;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ListingPhotoResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'property_id' => (string) $this->property_id,
            'room_id' => $this->room_id ? (string) $this->room_id : null,
            'url' => PublicFile::url($this->path),
            'sort_order' => (int) $this->sort_order,
            'is_cover' => (int) $this->sort_order === 0,
        ];
    }
}
