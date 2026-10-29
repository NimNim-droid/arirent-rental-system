<?php

namespace App\Http\Controllers;

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
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BillController extends Controller
{
    public function __construct(
        protected BillRepositoryInterface $billRepo,
        protected TenantRepositoryInterface $tenantRepo,
        protected BillService $billService,
        protected PaymentService $paymentService
    ) {}

    /**
     * List bills. Tenants only see their own; Admins see all.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $filters = [];

        // Role-based filtering
        if ($user && $user->role === 'tenant') {
            $tenant = $this->tenantRepo->findByUserIdOrEmail($user->id, $user->email);

            if (! $tenant) {
                return response()->json(['data' => []]);
            }

            $filters['tenant_id'] = $tenant->id;
        } else {
            // Admin filters
            if ($request->filled('tenant_id')) {
                $filters['tenant_id'] = $request->tenant_id;
            }

            if ($request->filled('status')) {
                $filters['status'] = $request->status;
            }
        }

        $perPage = min((int) $request->input('per_page', 50), 250);
        $paginated = $this->billRepo->paginate($perPage, $filters);

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
    public function show(int $id): JsonResponse
    {
        $user = request()->user();
        $bill = $this->billRepo->find($id, [
            'tenant:id,name,room,property_id',
            'tenant.property:id,name',
            'payments',
            'excessCharges',
            'readings',
        ]);

        if (! $bill) {
            return response()->json(['message' => 'Bill not found.'], 404);
        }

        // Tenants may only view their own bills (IDOR protection)
        if ($user && $user->role === 'tenant') {
            $tenant = $this->tenantRepo->findByUserIdOrEmail($user->id, $user->email);

            if (! $tenant || $bill->tenant_id !== $tenant->id) {
                return response()->json(['message' => 'Unauthorized to view this bill.'], 403);
            }
        }

        return response()->json([
            'data' => new BillResource($bill),
        ]);
    }

    /**
     * Retrieve 2-month delinquent tenants. Admin only.
     */
    public function delinquencies(): JsonResponse
    {
        if (request()->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $delinquents = $this->billService->getDelinquentTenants();
        return response()->json([
            'data' => $delinquents,
            'count' => count($delinquents),
        ]);
    }

    /**
     * Record a direct payment (Cash/Bank) by landlord. Admin only.
     */
    public function directPayment(Request $request, int $id): JsonResponse
    {
        if (request()->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $validated = $request->validate([
            'amount' => ['nullable', 'numeric', 'min:0.01'],
            'payment_method' => ['nullable', 'string', 'in:cash,bank_transfer,gcash,card'],
            'transaction_reference' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            $bill = $this->paymentService->recordDirectPayment($id, $validated);

            return response()->json([
                'message' => 'Direct payment recorded successfully.',
                'data' => new BillResource($bill),
                'bill' => new BillResource($bill),
            ]);
        } catch (ModelNotFoundException $e) {
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
        } catch (ModelNotFoundException $e) {
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
        if (request()->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        try {
            $bill = $this->billService->voidBill($id);

            return response()->json([
                'message' => 'Invoice voided successfully.',
                'data' => new BillResource($bill),
                'bill' => new BillResource($bill),
            ]);
        } catch (ModelNotFoundException $e) {
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
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Bill not found.'], 404);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
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
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Bill not found.'], 404);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Delete a bill.
     */
    public function destroy(int $id): JsonResponse
    {
        if (request()->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        try {
            $this->billService->deleteBill($id);

            return response()->json([
                'message' => 'Bill deleted successfully.',
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'Bill not found.'], 404);
        }
    }

    /**
     * Bulk delete multiple bills. Admin only.
     */
    public function bulkDestroy(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer'],
        ]);

        $deletedCount = $this->billService->bulkDeleteBills($validated['ids']);

        return response()->json([
            'message' => "Successfully deleted {$deletedCount} invoice(s).",
            'deleted' => $deletedCount,
        ]);
    }
}
