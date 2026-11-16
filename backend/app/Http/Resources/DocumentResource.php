<?php

namespace App\Http\Resources;

use App\Support\PrivateFile;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DocumentResource extends JsonResource
{
    /**
     * Transform a document metadata entry into an API response array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $doc = is_array($this->resource) ? $this->resource : (array) $this->resource;
        $storagePath = $doc['storage_path'] ?? null;

        return [
            'id' => (string) ($doc['id'] ?? ''),
            'name' => $doc['name'] ?? '',
            'category' => $doc['category'] ?? 'Contracts & Agreements',
            'type' => $doc['type'] ?? 'application/pdf',
            'size' => $doc['size'] ?? 0,
            'url' => ! empty($storagePath) ? PrivateFile::url($storagePath) : ($doc['url'] ?? null),
            'storage_path' => $storagePath,
            'uploaded_at' => $doc['uploaded_at'] ?? null,
            'uploaded_by' => $doc['uploaded_by'] ?? null,
            'description' => $doc['description'] ?? null,
        ];
    }
}

