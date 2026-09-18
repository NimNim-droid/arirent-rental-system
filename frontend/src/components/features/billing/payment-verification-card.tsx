import { useState } from "react";
import { CheckCircle, XCircle, FileImage, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatCurrency } from "@/lib/formatters";
import type { Bill } from "@/lib/types";

interface PaymentVerificationCardProps {
  payment: Bill;
  isBusy: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string, reason?: string) => void;
}

export function PaymentVerificationCard({
  payment,
  isBusy,
  onApprove,
  onReject,
}: PaymentVerificationCardProps) {
  const [showReceipt, setShowReceipt] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const handleConfirmReject = () => {
    setShowRejectModal(false);
    onReject(payment.id, rejectReason || "Payment rejected by the property manager.");
    setRejectReason("");
  };

  return (
    <>
      <Card className="p-5 border-warning-border bg-warning-bg/20 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-bold text-fg">
                {payment.tenant_name} (Room {payment.room})
              </h3>
              <p className="mt-1 text-xl font-extrabold text-fg tabular-nums">
                {formatCurrency(payment.total_amount)}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {payment.gcash_ref && (
                  <span className="rounded-lg border border-edge bg-card px-2.5 py-1 font-mono text-xs font-semibold text-fg-soft">
                    GCash Ref: {payment.gcash_ref}
                  </span>
                )}
                {payment.receipt_url && (
                  <button
                    type="button"
                    onClick={() => setShowReceipt(true)}
                    className="inline-flex items-center gap-1 rounded-lg border border-accent-border bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent transition-colors hover:bg-accent hover:text-white cursor-pointer"
                  >
                    <FileImage className="h-3.5 w-3.5" />
                    View Receipt
                  </button>
                )}
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <Badge variant="warning" dot>
                Needs Verification
              </Badge>
              <span className="text-[11px] text-muted">{payment.date}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 border-t border-warning-border/40 pt-3">
          <Button
            size="sm"
            className="flex-1"
            loading={isBusy}
            onClick={() => onApprove(payment.id)}
          >
            {!isBusy && (
              <>
                <CheckCircle className="h-4 w-4" />
                Approve Payment
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            loading={isBusy}
            onClick={() => setShowRejectModal(true)}
            className="text-danger-fg hover:bg-danger-bg hover:border-danger-border hover:text-danger-fg"
          >
            {!isBusy && (
              <>
                <XCircle className="h-4 w-4" />
                Reject
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Receipt Preview Lightbox Modal */}
      {payment.receipt_url && (
        <Modal
          open={showReceipt}
          onClose={() => setShowReceipt(false)}
          title={`Receipt Proof — ${payment.tenant_name} (${payment.gcash_ref || "No Ref"})`}
          footer={
            <div className="flex items-center justify-between w-full">
              <a
                href={payment.receipt_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:underline"
              >
                <ExternalLink className="h-4 w-4" /> Open in new tab
              </a>
              <Button size="sm" onClick={() => setShowReceipt(false)}>
                Done
              </Button>
            </div>
          }
        >
          <div className="flex flex-col items-center justify-center p-2">
            <img
              src={payment.receipt_url}
              alt={`Receipt for ${payment.tenant_name}`}
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

      {/* Reject Reason Modal */}
      <Modal
        open={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Reject GCash Payment"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowRejectModal(false)}
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
            Specify a reason for rejecting this payment. This will be shown to the tenant so they can correct their reference or re-upload.
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
    </>
  );
}
