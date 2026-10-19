import { useState } from "react";
import { ShieldCheck, ExternalLink } from "lucide-react";
import { SectionHeader } from "@/components/common/section-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { PaymentVerificationCard } from "./payment-verification-card";
import type { Bill } from "@/lib/types";

interface PendingVerificationsProps {
  payments: Bill[];
  loading: boolean;
  busyId: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string, reason?: string) => void;
}

export function PendingVerifications({
  payments,
  loading,
  busyId,
  onApprove,
  onReject,
}: PendingVerificationsProps) {
  const [receiptPayment, setReceiptPayment] = useState<Bill | null>(null);
  const [rejectPayment, setRejectPayment] = useState<Bill | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const handleConfirmReject = () => {
    if (!rejectPayment) return;
    onReject(
      rejectPayment.id,
      rejectReason.trim() || "Payment rejected by the property manager."
    );
    setRejectPayment(null);
    setRejectReason("");
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        dot
        dotClassName="text-accent"
        icon={<ShieldCheck className="h-5 w-5" />}
        title={`Pending GCash Payment Verifications (${payments.length})`}
        subtitle="Payment receipts that need to be confirmed"
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-edge bg-card p-5 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-8 w-full rounded-xl" />
          </div>
          <div className="rounded-2xl border border-edge bg-card p-5 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-8 w-full rounded-xl" />
          </div>
        </div>
      ) : payments.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            title="No payments to verify"
            description="All submitted GCash payments have been reviewed."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
          {payments.map((payment) => (
            <PaymentVerificationCard
              key={payment.id}
              payment={payment}
              isBusy={busyId === payment.id}
              onApprove={onApprove}
              onRequestReject={(p) => {
                setRejectPayment(p);
                setRejectReason("");
              }}
              onViewReceipt={(p) => setReceiptPayment(p)}
            />
          ))}
        </div>
      )}

      {/* Shared Receipt Preview Lightbox Modal */}
      {receiptPayment?.receipt_url && (
        <Modal
          open={!!receiptPayment}
          onClose={() => setReceiptPayment(null)}
          title={`Receipt Proof — ${receiptPayment.tenant_name} (${receiptPayment.gcash_ref || "No Ref"})`}
          footer={
            <div className="flex items-center justify-between w-full">
              <a
                href={receiptPayment.receipt_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:underline"
              >
                <ExternalLink className="h-4 w-4" /> Open in new tab
              </a>
              <Button size="sm" onClick={() => setReceiptPayment(null)}>
                Done
              </Button>
            </div>
          }
        >
          <div className="flex flex-col items-center justify-center p-2">
            <img
              src={receiptPayment.receipt_url}
              alt={`Receipt for ${receiptPayment.tenant_name}`}
              className="max-h-[65vh] w-auto rounded-xl object-contain shadow-md border border-edge"
              onError={(e) => {
                const target = e.currentTarget;
                target.onerror = null;
                target.src = "";
                target.alt = "Unable to load receipt image.";
              }}
            />
          </div>
        </Modal>
      )}

      {/* Shared Reject Reason Modal */}
      <Modal
        open={!!rejectPayment}
        onClose={() => setRejectPayment(null)}
        title="Reject GCash Payment"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setRejectPayment(null)}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleConfirmReject}
              className="bg-danger-fg text-white hover:bg-red-700"
            >
              Confirm Rejection
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm">
          <p className="text-muted text-xs">
            Specify a reason for rejecting this payment for{" "}
            <strong className="text-fg">{rejectPayment?.tenant_name}</strong>.
            This will be shown to the tenant so they can correct their reference or re-upload.
          </p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Reference number not found in GCash merchant account / incorrect amount"
            className="w-full rounded-xl border border-edge bg-card p-3 text-sm text-fg placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            rows={3}
          />
        </div>
      </Modal>
    </div>
  );
}
