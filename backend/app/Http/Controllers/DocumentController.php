<?php

namespace App\Http\Controllers;

use App\Http\Requests\Document\StoreDocumentRequest;
use App\Http\Resources\DocumentResource;
use App\Services\DocumentService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DocumentController extends Controller
{
    public function __construct(
        protected DocumentService $documentService
    ) {}

    /**
     * List all shared documents (viewable by both Admin and Tenant).
     */
    public function index(Request $request): JsonResponse
    {
        $docs = $this->documentService->listDocuments(
            $request->query('search'),
            $request->query('category')
        );

        return response()->json([
            'data' => DocumentResource::collection($docs),
        ]);
    }

    /**
     * Upload and publish an official document (Admin only).
     */
    public function store(StoreDocumentRequest $request): JsonResponse
    {
        $newDoc = $this->documentService->publishDocument(
            $request->file('file'),
            $request->validated(),
            $request->user()?->name
        );

        return response()->json([
            'message' => 'Document published successfully.',
            'data' => new DocumentResource($newDoc),
        ], 201);
    }

    /**
     * Remove an official document (Admin only).
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $this->documentService->deleteDocument($id);

            return response()->json([
                'message' => 'Document deleted successfully.',
            ]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Document not found.'], 404);
        }
    }
}
