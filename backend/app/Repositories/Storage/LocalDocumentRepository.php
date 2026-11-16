<?php

namespace App\Repositories\Storage;

use App\Repositories\Contracts\DocumentRepositoryInterface;
use App\Support\PrivateFile;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class LocalDocumentRepository implements DocumentRepositoryInterface
{
    private string $storageFile = 'documents.json';

    /**
     * Read documents from local storage. Legacy placeholder entries (url '#')
     * are dropped so a fresh install starts with an empty library.
     *
     * @return array<int, array<string, mixed>>
     */
    public function all(): array
    {
        if (! Storage::disk('local')->exists($this->storageFile)) {
            return [];
        }

        $content = Storage::disk('local')->get($this->storageFile);
        $decoded = json_decode((string) $content, true);

        if (! is_array($decoded)) {
            return [];
        }

        $documents = array_values(array_filter($decoded, function ($doc) {
            return is_array($doc)
                && (! empty($doc['storage_path']) || (($doc['url'] ?? null) !== '#'));
        }));

        if (count($documents) !== count($decoded)) {
            $this->saveAll($documents);
        }

        return $documents;
    }

    /**
     * Persist the full document metadata index to local private storage.
     *
     * @param array<int, array<string, mixed>> $documents
     */
    public function saveAll(array $documents): void
    {
        Storage::disk('local')->put(
            $this->storageFile,
            json_encode(array_values($documents), JSON_PRETTY_PRINT)
        );
    }

    public function storeFile(UploadedFile $file): string
    {
        return PrivateFile::store($file, 'documents');
    }

    public function deleteFile(?string $storagePath): void
    {
        PrivateFile::delete($storagePath);
    }
}

