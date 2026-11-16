<?php

namespace App\Services;

use App\Repositories\Contracts\DocumentRepositoryInterface;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\UploadedFile;

class DocumentService
{
    public function __construct(
        protected DocumentRepositoryInterface $documentRepo
    ) {}

    /**
     * List stored documents with optional search and category filtering.
     *
     * @return array<int, array<string, mixed>>
     */
    public function listDocuments(?string $search = null, ?string $category = null): array
    {
        $docs = $this->documentRepo->all();

        if ($search !== null && trim($search) !== '') {
            $needle = strtolower(trim($search));
            $docs = array_filter($docs, function (array $doc) use ($needle) {
                return str_contains(strtolower((string) ($doc['name'] ?? '')), $needle)
                    || str_contains(strtolower((string) ($doc['category'] ?? '')), $needle)
                    || str_contains(strtolower((string) ($doc['description'] ?? '')), $needle);
            });
        }

        if ($category !== null && $category !== '' && $category !== 'all') {
            $docs = array_filter($docs, function (array $doc) use ($category) {
                return strcasecmp((string) ($doc['category'] ?? ''), $category) === 0;
            });
        }

        return array_values($docs);
    }

    /**
     * Store a new uploaded document and prepend its metadata to the index.
     *
     * @return array<string, mixed>
     */
    public function publishDocument(UploadedFile $file, array $meta, ?string $uploadedBy = null): array
    {
        $path = $this->documentRepo->storeFile($file);

        $docName = ! empty($meta['name']) ? trim((string) $meta['name']) : $file->getClientOriginalName();
        if (! str_contains($docName, '.')) {
            $docName .= '.' . $file->getClientOriginalExtension();
        }

        $newDoc = [
            'id' => (string) (time() . rand(100, 999)),
            'name' => $docName,
            'category' => $meta['category'] ?? 'Contracts & Agreements',
            'type' => $file->getMimeType() ?: 'application/pdf',
            'size' => $file->getSize(),
            'url' => null,
            'storage_path' => $path,
            'uploaded_at' => now()->format('Y-m-d'),
            'uploaded_by' => $uploadedBy ?: 'Landlord Admin',
            'description' => $meta['description'] ?? null,
        ];

        $docs = $this->documentRepo->all();
        array_unshift($docs, $newDoc);
        $this->documentRepo->saveAll($docs);

        return $newDoc;
    }

    /**
     * Remove a document and its underlying private file by ID.
     *
     * @throws ModelNotFoundException
     */
    public function deleteDocument(string $id): void
    {
        $docs = $this->documentRepo->all();
        $targetIndex = null;
        $targetDoc = null;

        foreach ($docs as $index => $doc) {
            if ((string) ($doc['id'] ?? '') === $id) {
                $targetIndex = $index;
                $targetDoc = $doc;
                break;
            }
        }

        if ($targetIndex === null || $targetDoc === null) {
            throw new ModelNotFoundException('Document not found.');
        }

        if (! empty($targetDoc['storage_path'])) {
            $this->documentRepo->deleteFile((string) $targetDoc['storage_path']);
        }

        array_splice($docs, $targetIndex, 1);
        $this->documentRepo->saveAll($docs);
    }
}

