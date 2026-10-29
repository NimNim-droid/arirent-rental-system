<?php

namespace App\Http\Controllers;

use App\Support\PrivateFile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    private string $storageFile = 'documents.json';

    /**
     * Read documents from local storage. Old seeded placeholders (url '#')
     * are dropped so a fresh install starts with an empty library.
     */
    private function getStoredDocuments(): array
    {
        if (! Storage::disk('local')->exists($this->storageFile)) {
            return [];
        }

        $content = Storage::disk('local')->get($this->storageFile);
        $decoded = json_decode($content, true);

        if (! is_array($decoded)) {
            return [];
        }

        $documents = array_values(array_filter($decoded, function ($doc) {
            return is_array($doc)
                && (! empty($doc['storage_path']) || (($doc['url'] ?? null) !== '#'));
        }));

        if (count($documents) !== count($decoded)) {
            $this->saveDocuments($documents);
        }

        return $documents;
    }

    /**
     * Save documents list to storage file.
     */
    private function saveDocuments(array $documents): void
    {
        Storage::disk('local')->put($this->storageFile, json_encode(array_values($documents), JSON_PRETTY_PRINT));
    }

    /**
     * Replace the stored path with a short-lived signed URL for the API response.
     */
    private function presentDocument(array $doc): array
    {
        if (! empty($doc['storage_path'])) {
            $doc['url'] = PrivateFile::url($doc['storage_path']);
        }

        return $doc;
    }

    /**
     * List all shared documents (viewable by both Admin and Tenant).
     */
    public function index(Request $request): JsonResponse
    {
        $docs = $this->getStoredDocuments();

        // Optional search filter
        if ($search = $request->query('search')) {
            $search = strtolower(trim($search));
            $docs = array_filter($docs, function ($doc) use ($search) {
                return str_contains(strtolower($doc['name'] ?? ''), $search)
                    || str_contains(strtolower($doc['category'] ?? ''), $search)
                    || str_contains(strtolower($doc['description'] ?? ''), $search);
            });
        }

        // Optional category filter
        if ($category = $request->query('category')) {
            if ($category !== 'all') {
                $docs = array_filter($docs, function ($doc) use ($category) {
                    return strcasecmp($doc['category'] ?? '', $category) === 0;
                });
            }
        }

        return response()->json([
            'data' => array_map(fn (array $doc) => $this->presentDocument($doc), array_values($docs)),
        ]);
    }

    /**
     * Upload and publish an official document (Admin only).
     */
    public function store(Request $request): JsonResponse
    {
        if ($request->user() && $request->user()->role !== 'admin') {
            return response()->json([
                'message' => 'Unauthorized. Only landlords and administrators can upload official documentation.',
            ], 403);
        }

        $validated = $request->validate([
            'file' => 'required|file|max:25600|mimes:pdf,doc,docx,xls,xlsx,png,jpg,jpeg,webp,txt',
            'name' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:100',
            'description' => 'nullable|string|max:500',
        ]);

        $file = $request->file('file');
        $path = PrivateFile::store($file, 'documents');

        $docName = !empty($validated['name']) ? trim($validated['name']) : $file->getClientOriginalName();
        // Ensure extension is retained if user didn't specify one
        if (!str_contains($docName, '.')) {
            $docName .= '.' . $file->getClientOriginalExtension();
        }

        $newDoc = [
            'id' => (string) (time() . rand(100, 999)),
            'name' => $docName,
            'category' => $validated['category'] ?? 'Contracts & Agreements',
            'type' => $file->getMimeType() ?: 'application/pdf',
            'size' => $file->getSize(),
            'url' => null,
            'storage_path' => $path,
            'uploaded_at' => now()->format('Y-m-d'),
            'uploaded_by' => $request->user()->name ?? 'Landlord Admin',
            'description' => $validated['description'] ?? null,
        ];

        $docs = $this->getStoredDocuments();
        array_unshift($docs, $newDoc);
        $this->saveDocuments($docs);

        return response()->json([
            'message' => 'Document published successfully.',
            'data' => $this->presentDocument($newDoc),
        ], 201);
    }

    /**
     * Remove an official document (Admin only).
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        if ($request->user() && $request->user()->role !== 'admin') {
            return response()->json([
                'message' => 'Unauthorized. Only landlords and administrators can delete official documentation.',
            ], 403);
        }

        $docs = $this->getStoredDocuments();
        $targetIndex = null;
        $targetDoc = null;

        foreach ($docs as $index => $doc) {
            if ((string) $doc['id'] === (string) $id) {
                $targetIndex = $index;
                $targetDoc = $doc;
                break;
            }
        }

        if ($targetIndex === null) {
            return response()->json(['message' => 'Document not found.'], 404);
        }

        // Remove actual file from private storage (legacy public files are handled too).
        if (!empty($targetDoc['storage_path'])) {
            PrivateFile::delete($targetDoc['storage_path']);
        }

        array_splice($docs, $targetIndex, 1);
        $this->saveDocuments($docs);

        return response()->json([
            'message' => 'Document deleted successfully.',
        ]);
    }
}
