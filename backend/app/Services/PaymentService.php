<?php

namespace App\Services;

use App\Models\Bill;
use App\Repositories\Contracts\BillRepositoryInterface;
use App\Repositories\Contracts\TenantRepositoryInterface;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use InvalidArgumentException;

class PaymentService
{
    public function __construct(
        protected BillRepositoryInterface $billRepo,
        protected TenantRepositoryInterface $tenantRepo
    ) {}

    public function submitPayment(int $billId, array $data, ?UploadedFile $receipt = null): Bill
    {
        $bill = $this->billRepo->find($billId);
        if (! $bill) {
            throw new ModelNotFoundException('Bill not found.');
        }

        if ($bill->status === 'paid') {
            throw new InvalidArgumentException('This invoice has already been paid.');
        }

        if ($bill->status === 'voided') {
            throw new InvalidArgumentException('This invoice has been voided.');
        }

        $receiptUrl = $bill->receipt_url;

        if ($receipt) {
            if ($bill->receipt_url && str_starts_with($bill->receipt_url, '/storage/')) {
                $oldPath = str_replace('/storage/', '', $bill->receipt_url);
                Storage::disk('public')->delete($oldPath);
            }
            $path = $receipt->store('receipts', 'public');
            $receiptUrl = '/storage/' . $path;
        }

        $bill = $this->billRepo->update($billId, [
            'status' => 'pending_verification',
            'gcash_ref' => $data['gcash_ref'],
            'receipt_url' => $receiptUrl,
            'notes' => $data['notes'] ?? $bill->notes,
            'payment_date' => now(),
            'reject_reason' => null,
        ]);

        Cache::forget('admin_stats_all');
        Cache::forget("tenant_dashboard_{$bill->tenant_id}");

        return $bill;
    }

    public function verifyPayment(int $billId, bool $approved, ?string $rejectReason = null): Bill
    {
        $bill = $this->billRepo->find($billId);
        if (! $bill) {
            throw new ModelNotFoundException('Bill not found.');
        }

        if ($approved) {
            if ($bill->status !== 'pending_verification') {
                throw new InvalidArgumentException('This bill cannot be approved. Current status: ' . $bill->status);
            }

            return DB::transaction(function () use ($billId) {
                $bill = $this->billRepo->update($billId, [
                    'status' => 'paid',
                    'approved_date' => now(),
                    'reject_reason' => null,
                ]);

                $tenant = $this->tenantRepo->find((int) $bill->tenant_id);
                if ($tenant) {
                    $tenant->decrement('balance', min((float) $tenant->balance, (float) $bill->total_amount));
                }

                Cache::forget('admin_stats_all');
                Cache::forget("tenant_dashboard_{$bill->tenant_id}");

                return $bill;
            });
        }

        $bill = $this->billRepo->update($billId, [
            'status' => 'unpaid',
            'reject_reason' => $rejectReason ?? 'Invalid or unverified GCash reference number.',
        ]);

        Cache::forget('admin_stats_all');
        Cache::forget("tenant_dashboard_{$bill->tenant_id}");

        return $bill;
    }
}
