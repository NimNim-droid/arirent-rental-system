<?php

namespace App\Repositories\Contracts;

use Illuminate\Http\UploadedFile;

interface DocumentRepositoryInterface
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public function all(): array;

    /**
     * @param array<int, array<string, mixed>> $documents
     */
    public function saveAll(array $documents): void;

    public function storeFile(UploadedFile $file): string;

    public function deleteFile(?string $storagePath): void;
}

