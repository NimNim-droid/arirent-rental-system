<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    private string $storageFile = 'documents.json';

    /**
     * Default seed documents available out-of-the-box.
     */
    private function defaultDocuments(): array
    {
        return [
            [
                'id' => '1',
                'name' => 'AriRent Standard Lease Contract & Agreement.pdf',
                'category' => 'Contracts & Agreements',
                'type' => 'application/pdf',
                'size' => 2457600,
                'url' => '#',
                'uploaded_at' => now()->subMonths(1)->format('Y-m-d'),
                'uploaded_by' => 'Property Management',
                'description' => 'Official residential tenancy agreement outlining lease terms, security deposits, and conditions.',
            ],
            [
                'id' => '2',
                'name' => 'AriRent House Rules & Safety Regulations.pdf',
                'category' => 'House Rules & Regulations',
                'type' => 'application/pdf',
                'size' => 1245184,
                'url' => '#',
                'uploaded_at' => now()->subMonths(2)->format('Y-m-d'),
                'uploaded_by' => 'Property Management',
                'description' => 'Quiet hours, guest policies, garbage disposal, and emergency safety guidelines for all tenants.',
            ],
            [
                'id' => '3',
                'name' => 'Unit Move-In Checklist & Inspection Report.pdf',
                'category' => 'Checklists & Guides',
                'type' => 'application/pdf',
                'size' => 842100,
                'url' => '#',
                'uploaded_at' => now()->subMonths(2)->format('Y-m-d'),
                'uploaded_by' => 'Property Management',
                'description' => 'Mandatory initial condition report covering unit fixtures, appliances, and utility meter baselines.',
            ],
            [
                'id' => '4',
                'name' => 'Billing Schedule & Payment Policy Notice.pdf',
                'category' => 'Notices & Policies',
                'type' => 'application/pdf',
                'size' => 512000,
                'url' => '#',
                'uploaded_at' => now()->subMonths(1)->format('Y-m-d'),
                'uploaded_by' => 'Property Management',
                'description' => 'Detailed payment channels, GCash settlement procedures, due date rules, and penalty policies.',
            ],
        ];
    }

    /**
     * Read documents from local storage file or fallback to defaults.
     */
    private function getStoredDocuments(): array
    {
        if (Storage::disk('local')->exists($this->storageFile)) {
            $content = Storage::disk('local')->get($this->storageFile);
            $decoded = json_decode($content, true);
            if (is_array($decoded)) {
                return $decoded;
            }
        }

        $defaults = $this->defaultDocuments();
        Storage::disk('local')->put($this->storageFile, json_encode($defaults, JSON_PRETTY_PRINT));
        return $defaults;
    }

    /**
     * Save documents list to storage file.
     */
    private function saveDocuments(array $documents): void
    {
        Storage::disk('local')->put($this->storageFile, json_encode(array_values($documents), JSON_PRETTY_PRINT));
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
            'data' => array_values($docs),
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
        $path = $file->store('documents', 'public');
        $fileUrl = '/storage/' . $path;

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
            'url' => $fileUrl,
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
            'data' => $newDoc,
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

        // Remove actual file if it was uploaded to storage
        if (!empty($targetDoc['storage_path']) && Storage::disk('public')->exists($targetDoc['storage_path'])) {
            Storage::disk('public')->delete($targetDoc['storage_path']);
        }

        array_splice($docs, $targetIndex, 1);
        $this->saveDocuments($docs);

        return response()->json([
            'message' => 'Document deleted successfully.',
        ]);
    }
}
