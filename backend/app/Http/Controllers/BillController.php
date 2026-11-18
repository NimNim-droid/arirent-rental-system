<?php

namespace App\Http\Controllers;

use App\Exceptions\DomainException;
use App\Http\Requests\Bill\BulkDeleteBillsRequest;
use App\Http\Requests\Bill\DirectPaymentRequest;
use App\Http\Requests\Bill\GenerateBillsRequest;
use App\Http\Requests\Bill\ProcessPaymentRequest;
use App\Http\Requests\Bill\StoreBillRequest;
use App\Http\Requests\Bill\UpdateBillRequest;
use App\Http\Requests\Bill\VerifyPaymentRequest;
use App\Http\Resources\BillResource;
use App\Repositories\Contracts\BillRepositoryInterface;
use App\Repositories\Contracts\TenantRepositoryInterface;
use App\Services\BillService;
use App\Services\PaymentService;
use App\Services\XenditService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BillController extends Controller
{
    public function __construct(
        protected BillService $billService,
        protected PaymentService $paymentService,
        protected XenditService $xenditService
    ) {}

    /**
     * List bills. Tenants only see their own; Admins see all.
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['tenant_id', 'status']);
        $perPage = min((int) $request->input('per_page', 50), 250);
        $paginated = $this->billService->listBills($request->user(), $filters, $perPage);

        if (! $paginated) {
            return response()->json(['data' => []]);
        }

        return response()->json([
            'data' => BillResource::collection($paginated->getCollection()),
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
            ],
        ]);
    }

    /**
     * Show a single bill.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        try {
            $bill = $this->billService->getBillDetails($request->user(), $id);

            return response()->json([
                'data' => new BillResource($bill),
            ]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Bill not found.'], 404);
        } catch (DomainException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatusCode());
        }
    }

    /**
     * Retrieve 2-month delinquent tenants. Admin only.
     */
    public function delinquencies(): JsonResponse
    {
        $delinquents = $this->billService->getDelinquentTenants();

        return response()->json([
            'data' => $delinquents,
            'count' => count($delinquents),
        ]);
    }

    /**
     * Record a direct payment (Cash/Bank) by landlord. Admin only.
     */
    public function directPayment(DirectPaymentRequest $request, int $id): JsonResponse
    {
        try {
            $bill = $this->paymentService->recordDirectPayment($id, $request->validated());

            return response()->json([
                'message' => 'Direct payment recorded successfully.',
                'data' => new BillResource($bill),
                'bill' => new BillResource($bill),
            ]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Bill not found.'], 404);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Create a single bill manually. Admin only.
     */
    public function store(StoreBillRequest $request): JsonResponse
    {
        $bill = $this->billService->createBill(
            $request->validated(),
            $request->filled('prev_reading') ? (float) $request->prev_reading : null,
            $request->filled('curr_reading') ? (float) $request->curr_reading : null
        );

        return response()->json([
            'message' => 'Bill created successfully.',
            'data' => new BillResource($bill),
            'bill' => new BillResource($bill),
        ], 201);
    }

    /**
     * Batch-generate monthly bills for all active tenants. Admin only.
     */
    public function generate(GenerateBillsRequest $request): JsonResponse
    {
        $result = $this->billService->generateMonthlyBills($request->input('date'));

        return response()->json($result);
    }

    /**
     * Update a bill. Admin only.
     */
    public function update(UpdateBillRequest $request, int $id): JsonResponse
    {
        try {
            $bill = $this->billService->updateBill($id, $request->validated());

            return response()->json([
                'message' => 'Bill updated successfully.',
                'data' => new BillResource($bill),
                'bill' => new BillResource($bill),
            ]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Bill not found.'], 404);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Void an invoice that has no recorded payments. Admin only.
     */
    public function void(int $id): JsonResponse
    {
        try {
            $bill = $this->billService->voidBill($id);

            return response()->json([
                'message' => 'Invoice voided successfully.',
                'data' => new BillResource($bill),
                'bill' => new BillResource($bill),
            ]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Bill not found.'], 404);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Tenant submits payment (GCash Reference Number & Receipt).
     */
    public function pay(ProcessPaymentRequest $request, int $id): JsonResponse
    {
        try {
            $bill = $this->paymentService->submitPayment(
                $id,
                $request->validated(),
                $request->file('receipt')
            );

            return response()->json([
                'message' => 'Payment submitted successfully. Awaiting landlord verification.',
                'data' => new BillResource($bill),
                'bill' => new BillResource($bill),
            ]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Bill not found.'], 404);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Create a Xendit online checkout session for a bill (GCash, Maya, Bank Transfer, Card, QR Ph).
     */
    public function xenditCheckout(Request $request, int $id): JsonResponse
    {
        if (! $this->canAccessBill($request, $id)) {
            return response()->json(['message' => 'This action is unauthorized.'], 403);
        }

        $validated = $request->validate([
            'amount' => ['nullable', 'numeric', 'min:1'],
            'redirect_origin' => ['nullable', 'string', 'max:255'],
        ]);

        $origin = (string) ($validated['redirect_origin'] ?? $request->header('Origin') ?? config('app.url'));

        try {
            $session = $this->xenditService->createCheckoutInvoice(
                $id,
                isset($validated['amount']) ? (float) $validated['amount'] : 0.0,
                $origin
            );

            return response()->json([
                'message' => 'Xendit checkout session created.',
                'data' => $session,
                ...$session,
            ]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Bill not found.'], 404);
        } catch (\InvalidArgumentException|\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Verify and confirm a Xendit online payment after redirect back to the app.
     */
    public function xenditVerify(Request $request, int $id): JsonResponse
    {
        if (! $this->canAccessBill($request, $id)) {
            return response()->json(['message' => 'This action is unauthorized.'], 403);
        }

        $validated = $request->validate([
            'invoice_id' => ['nullable', 'string', 'max:120'],
            'external_id' => ['nullable', 'string', 'max:120'],
            'payment_channel' => ['nullable', 'string', 'max:60'],
        ]);

        $lookupId = $validated['invoice_id'] ?? $validated['external_id'] ?? null;

        try {
            $bill = $this->xenditService->verifyAndConfirmPayment(
                $id,
                $lookupId,
                $validated['payment_channel'] ?? null
            );

            return response()->json([
                'message' => 'Online payment confirmed via Xendit!',
                'data' => new BillResource($bill),
                'bill' => new BillResource($bill),
            ]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Bill not found.'], 404);
        } catch (\InvalidArgumentException|\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Handle incoming Xendit Invoice Webhook callback.
     */
    public function xenditWebhook(Request $request): JsonResponse
    {
        try {
            $bill = $this->xenditService->handleWebhook(
                $request->all(),
                $request->header('x-callback-token')
            );

            return response()->json([
                'message' => 'Webhook processed.',
                'bill_id' => $bill?->id,
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 401);
        }
    }

    /**
     * Check whether the current user is allowed to pay/verify the specified bill.
     */
    protected function canAccessBill(Request $request, int $billId): bool
    {
        $user = $request->user();
        if (! $user) {
            return false;
        }

        if ($user->role === 'admin') {
            return true;
        }

        if ($user->role === 'tenant') {
            $bill = app(BillRepositoryInterface::class)->find($billId);
            if (! $bill) {
                return true; // Let controller return 404
            }

            $tenant = app(TenantRepositoryInterface::class)->findByUserIdOrEmail($user->id, $user->email);

            return $tenant && (int) $bill->tenant_id === (int) $tenant->id;
        }

        return false;
    }

    /**
     * Landlord verifies or rejects a submitted payment. Admin only.
     */
    public function verify(VerifyPaymentRequest $request, int $id): JsonResponse
    {
        $validated = $request->validated();

        try {
            $bill = $this->paymentService->verifyPayment(
                $id,
                (bool) $validated['approved'],
                $validated['reject_reason'] ?? null
            );

            $message = $validated['approved']
                ? 'Payment approved successfully. Bill marked as paid.'
                : 'Payment rejected. Bill returned to unpaid status.';

            return response()->json([
                'message' => $message,
                'data' => new BillResource($bill),
                'bill' => new BillResource($bill),
            ]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Bill not found.'], 404);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Delete a bill. Admin only.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $this->billService->deleteBill($id);

            return response()->json([
                'message' => 'Bill deleted successfully.',
            ]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Bill not found.'], 404);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Bulk delete multiple bills. Admin only.
     */
    public function bulkDestroy(BulkDeleteBillsRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $deletedCount = $this->billService->bulkDeleteBills($validated['ids']);

        return response()->json([
            'message' => "Successfully deleted {$deletedCount} invoice(s).",
            'deleted' => $deletedCount,
        ]);
    }
}
