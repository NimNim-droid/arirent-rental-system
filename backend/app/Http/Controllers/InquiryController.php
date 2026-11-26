<?php

namespace App\Http\Controllers;

use App\Exceptions\DomainException;
use App\Http\Requests\Inquiry\StoreInquiryRequest;
use App\Http\Requests\Inquiry\UpdateInquiryRequest;
use App\Http\Resources\InquiryResource;
use App\Services\InquiryService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InquiryController extends Controller
{
    public function __construct(
        protected InquiryService $inquiryService
    ) {}

    /**
     * Public endpoint: submit a viewing / visit inquiry.
     */
    public function store(StoreInquiryRequest $request): JsonResponse
    {
        try {
            $inquiry = $this->inquiryService->submitInquiry($request->validated());

            return response()->json([
                'message' => 'Viewing request received. The property manager will contact you to confirm the schedule.',
                'data' => new InquiryResource($inquiry),
            ], 201);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Property not found.'], 404);
        } catch (DomainException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatusCode());
        }
    }

    /**
     * Admin endpoint: list inquiries with filters and status counts.
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['property_id', 'status', 'search']);
        $perPage = min(max((int) $request->input('per_page', 50), 1), 250);

        $result = $this->inquiryService->listInquiries($filters, $perPage);
        $paginated = $result['paginator'];

        return response()->json([
            'data' => InquiryResource::collection($paginated->getCollection()),
            'links' => [
                'first' => $paginated->url(1),
                'last' => $paginated->url($paginated->lastPage()),
                'prev' => $paginated->previousPageUrl(),
                'next' => $paginated->nextPageUrl(),
            ],
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
                'status_counts' => $result['status_counts'],
            ],
        ]);
    }

    /**
     * Admin endpoint: show a single inquiry.
     */
    public function show(int $id): JsonResponse
    {
        try {
            $inquiry = $this->inquiryService->getInquiry($id);

            return response()->json([
                'data' => new InquiryResource($inquiry),
            ]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Inquiry not found.'], 404);
        }
    }

    /**
     * Admin endpoint: update inquiry status, visit schedule, or notes.
     */
    public function update(UpdateInquiryRequest $request, int $id): JsonResponse
    {
        try {
            $inquiry = $this->inquiryService->updateInquiry($id, $request->validated());

            return response()->json([
                'message' => 'Inquiry updated.',
                'data' => new InquiryResource($inquiry),
            ]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Inquiry not found.'], 404);
        }
    }

    /**
     * Admin endpoint: delete an inquiry.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $this->inquiryService->deleteInquiry($id);

            return response()->json([
                'message' => 'Inquiry deleted.',
            ]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Inquiry not found.'], 404);
        }
    }
}
