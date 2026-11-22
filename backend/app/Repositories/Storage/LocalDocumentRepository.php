<?php

namespace App\Repositories\Storage;

use App\Repositories\Contracts\DocumentRepositoryInterface;
use App\Support\PrivateFile;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

class LocalDocumentRepository implements DocumentRepositoryInterface
{
    private string $storageFile = 'documents.json';

    private const DB_INDEX_KEY = 'arirent_storage:documents.json';

    private const DB_EXPIRATION = 2147483647;

    /**
     * Read documents from local storage. Legacy placeholder entries (url '#')
     * are dropped so a fresh install starts with an empty library.
     *
     * @return array<int, array<string, mixed>>
     */
    public function all(): array
    {
        if (! Storage::disk('local')->exists($this->storageFile)) {
            try {
                $backedUp = DB::table('cache')->where('key', self::DB_INDEX_KEY)->value('value');

                if (is_string($backedUp) && $backedUp !== '') {
                    Storage::disk('local')->put($this->storageFile, $backedUp);
                }
            } catch (Throwable) {
                // Continue with empty fallback if database backup cannot be read.
            }
        }

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
        $json = json_encode(array_values($documents), JSON_PRETTY_PRINT);
        if ($json === false) {
            return;
        }

        Storage::disk('local')->put($this->storageFile, $json);

        try {
            DB::table('cache')->updateOrInsert(
                ['key' => self::DB_INDEX_KEY],
                [
                    'value' => $json,
                    'expiration' => self::DB_EXPIRATION,
                ]
            );
        } catch (Throwable) {
            // Local file write succeeded; ignore DB backup failure if table is absent.
        }
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

