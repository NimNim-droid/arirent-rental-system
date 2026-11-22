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

    private const DB_SEEDED_KEY = 'arirent_storage:defaults_seeded';

    private const DB_EXPIRATION = 2147483647;

    /**
     * Official AriRent PDFs bundled in resources/documents/ for first-run seeding.
     *
     * @var array<int, array{id: string, name: string, category: string, filename: string, description: string}>
     */
    private const BUNDLED_DOCUMENTS = [
        [
            'id' => 'default-lease-agreement',
            'name' => 'Standard Lease Agreement & Contract.pdf',
            'category' => 'Contracts & Agreements',
            'filename' => 'standard-lease-agreement.pdf',
            'description' => 'Official residential rental agreement template covering lease term, rent, deposit, utilities, and responsibilities.',
        ],
        [
            'id' => 'default-house-rules',
            'name' => 'Building House Rules & Safety Regulations.pdf',
            'category' => 'House Rules & Regulations',
            'filename' => 'building-house-rules.pdf',
            'description' => 'Tenant guide for quiet hours, cleanliness, fire safety, appliances, visitors, and building security.',
        ],
        [
            'id' => 'default-inspection-checklist',
            'name' => 'Move-In & Move-Out Inspection Checklist.pdf',
            'category' => 'Checklists & Guides',
            'filename' => 'move-in-move-out-checklist.pdf',
            'description' => 'Joint room and fixture condition checklist, initial utility meter readings, and key handover inventory.',
        ],
        [
            'id' => 'default-billing-policy',
            'name' => 'Billing Schedule & 2-Month Delinquency Policy Notice.pdf',
            'category' => 'Notices & Policies',
            'filename' => 'billing-schedule-delinquency-policy.pdf',
            'description' => 'Official policy on monthly billing schedules, payment verification, partial payments, and 2-month delinquency follow-up.',
        ],
    ];

    /**
     * Read documents from local storage. Legacy placeholder entries (url '#')
     * are dropped; on non-testing environments, bundled official PDFs are seeded
     * once if the library has not been initialized yet.
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
            $this->seedBundledDocumentsIfUninitialized();
        }

        if (! Storage::disk('local')->exists($this->storageFile)) {
            return [];
        }

        $documents = $this->readDecodedDocuments();

        if ($documents === []) {
            $this->seedBundledDocumentsIfUninitialized();
            $documents = $this->readDecodedDocuments();
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

    /**
     * Decode documents.json and prune any legacy placeholder entries.
     *
     * @return array<int, array<string, mixed>>
     */
    private function readDecodedDocuments(): array
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
     * Seed the 4 bundled official AriRent PDFs once on uninitialized installs.
     */
    private function seedBundledDocumentsIfUninitialized(): void
    {
        if (app()->environment('testing')) {
            return;
        }

        try {
            if (DB::table('cache')->where('key', self::DB_SEEDED_KEY)->exists()) {
                return;
            }
        } catch (Throwable) {
            // Proceed using local disk check if cache table is unavailable.
        }

        $seeded = [];

        foreach (self::BUNDLED_DOCUMENTS as $entry) {
            $sourcePath = base_path('resources/documents/'.$entry['filename']);
            if (! is_file($sourcePath)) {
                continue;
            }

            $bytes = @file_get_contents($sourcePath);
            if ($bytes === false || $bytes === '') {
                continue;
            }

            $storagePath = 'documents/'.$entry['filename'];
            Storage::disk('local')->put($storagePath, $bytes);
            PrivateFile::backupBytes($storagePath, $bytes);

            $seeded[] = [
                'id' => $entry['id'],
                'name' => $entry['name'],
                'category' => $entry['category'],
                'type' => 'application/pdf',
                'size' => strlen($bytes),
                'url' => null,
                'storage_path' => $storagePath,
                'uploaded_at' => now()->format('Y-m-d'),
                'uploaded_by' => 'Property Management',
                'description' => $entry['description'],
            ];
        }

        if ($seeded === []) {
            return;
        }

        $this->saveAll($seeded);

        try {
            DB::table('cache')->updateOrInsert(
                ['key' => self::DB_SEEDED_KEY],
                [
                    'value' => '1',
                    'expiration' => self::DB_EXPIRATION,
                ]
            );
        } catch (Throwable) {
            // Local file seeding succeeded; ignore DB marker failure if table is absent.
        }
    }
}
