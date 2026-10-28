import { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Building2,
  Calendar,
  CreditCard,
  AlertTriangle,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { Bill } from "@/lib/types";

interface PaymentReviewModalProps {
  open: boolean;
  onClose: () => void;
  payments: Bill[];
  busyId: string | null;
  onApprove: (id: string) => Promise<void> | void;
  onReject: (id: string, reason?: string) => Promise<void> | void;
}

/**
 * PaymentReviewModal
 * Interactive "Triage Queue" modal for reviewing multiple payment submissions one-by-one.
 * Features:
 * - Next/Previous stepper
 * - Side-by-side transaction breakdown & proof of payment inspection
 * - One-click approval and rejection with customized tenant guidance
 */
export function PaymentReviewModal({
  open,
  onClose,
  payments,
  busyId,
  onApprove,
  onReject,
}: PaymentReviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Keep index within bounds if payments count decreases
  useEffect(() => {
    if (currentIndex >= payments.length && payments.length > 0) {
      setCurrentIndex(Math.max(0, payments.length - 1));
    }
    setIsRejecting(false);
    setRejectReason("");
  }, [payments.length, currentIndex]);

  if (!open || payments.length === 0) return null;

  const current = payments[currentIndex] || payments[0];
  const isBusy = busyId === current.id;
  const isLast = payments.length === 1;

  const handleNext = () => {
    if (currentIndex < payments.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsRejecting(false);
      setRejectReason("");
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsRejecting(false);
      setRejectReason("");
    }
  };

  const handleApprove = async () => {
    await onApprove(current.id);
    if (isLast) {
      onClose();
    }
  };

  const handleConfirmReject = async () => {
    await onReject(
      current.id,
      rejectReason.trim() || "Payment reference not verified. Please check and resubmit."
    );
    setIsRejecting(false);
    setRejectReason("");
    if (isLast) {
      onClose();
    }
  };

  const propertyName = current.property_name || current.tenant?.property?.name || "AriRent Property";
  const residentName = current.tenant_name || current.tenant?.name || "Resident";
  const roomNumber = current.room || current.tenant?.room || "—";
  const paymentRef = current.gcash_ref || "Ref not specified";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Payment Review Queue (${currentIndex + 1} of ${payments.length})`}
      maxWidth="xl"
      footer={
        <div className="flex w-full items-center justify-between no-print gap-2">
          {/* Queue Navigation Buttons */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePrev}
              disabled={currentIndex === 0 || isBusy}
              className="gap-1 px-2.5"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
            </Button>
            <span className="text-xs font-semibold text-muted px-2 tabular-nums">
              {currentIndex + 1} / {payments.length}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleNext}
              disabled={currentIndex >= payments.length - 1 || isBusy}
              className="gap-1 px-2.5"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {!isRejecting ? (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={isBusy}
                  onClick={() => setIsRejecting(true)}
                  className="text-danger-fg hover:border-danger-border hover:bg-danger-bg hover:text-danger-fg gap-1.5"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Reject</span>
                </Button>

                <Button
                  size="sm"
                  loading={isBusy}
                  onClick={handleApprove}
                  className="bg-success-fg hover:bg-emerald-700 text-white gap-1.5 shadow-sm font-semibold"
                >
                  {!isBusy && <CheckCircle className="h-4 w-4" />}
                  <span>Approve & Credit Payment</span>
                </Button>
              </>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => setIsRejecting(false)}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-sm">
        {/* ================= Top Submitter Strip ================= */}
        <div className="rounded-md border border-edge bg-inset p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-fg text-[15px]">{residentName}</h3>
              <Badge variant="warning" dot>
                Awaiting verification
              </Badge>
            </div>
            <p className="text-xs text-muted flex items-center gap-1.5 mt-0.5">
              <Building2 className="h-3.5 w-3.5 text-accent" />
              <span>{propertyName}</span>
              <span>•</span>
              <span className="font-medium text-fg">Unit / Room {roomNumber}</span>
            </p>
          </div>

          <div className="sm:text-right">
            <p className="text-[11px] text-muted">
              Amount to credit
            </p>
            <p className="text-lg font-semibold text-fg tabular-nums">
              {formatCurrency(current.total_amount)}
            </p>
          </div>
        </div>

        {/* ================= Two Column Review Panel ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {/* Left Column: Transaction Details */}
          <div className="space-y-3">
            <div className="rounded-md border border-edge bg-card p-3.5 space-y-3">
              <p className="text-xs font-medium text-muted flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5 text-accent" />
                Transaction submission data
              </p>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-edge/60">
                  <span className="text-muted">Payment reference no.</span>
                  <span className="font-mono font-medium text-fg text-xs bg-inset px-2 py-0.5 rounded border border-edge">
                    {paymentRef}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-edge/60">
                  <span className="text-muted">Invoice reference</span>
                  <span className="font-mono font-medium text-fg text-xs">
                    #INV-{current.id}
                  </span>
                </div>

                {current.date && (
                  <div className="flex justify-between items-center py-1 border-b border-edge/60">
                    <span className="text-muted">Statement due date</span>
                    <span className="font-medium text-fg">
                      {formatDate(current.due_date)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center py-1">
                  <span className="text-muted">Reconciliation status</span>
                  <span className="font-medium text-warning-fg">Pending landlord confirmation</span>
                </div>
              </div>
            </div>

            {/* Rejection Reason Form (Revealed when clicking Reject) */}
            {isRejecting ? (
              <div className="rounded-md border border-danger-border bg-danger-bg/30 p-3.5 space-y-2.5 animate-fade-in">
                <div className="flex items-center gap-2 text-danger-fg font-medium text-xs">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>Specify rejection reason</span>
                </div>
                <p className="text-xs text-danger-fg/90 leading-relaxed">
                  This explanation will be sent to <strong>{residentName}</strong> so they can correct their reference number or re-upload clearer proof.
                </p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Reference number not found in account / amount does not match / blurry screenshot"
                  className="w-full rounded-md border border-danger-border bg-card p-2.5 text-[13px] text-fg placeholder:text-faint focus:border-danger-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-fg/15"
                  rows={3}
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsRejecting(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={handleConfirmReject}
                    disabled={isBusy}
                  >
                    Confirm & Notify Resident
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-md border border-edge bg-inset p-3 text-xs text-muted flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-accent shrink-0" />
                <span>
                  Confirming this payment will mark invoice <strong>#INV-{current.id}</strong> as Paid and set the resident&apos;s balance to ₱0.00.
                </span>
              </div>
            )}
          </div>

          {/* Right Column: Uploaded Proof of Payment Screenshot */}
          <div className="rounded-md border border-edge bg-card p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted">
                Uploaded proof of payment
              </p>
              {current.receipt_url && (
                <a
                  href={current.receipt_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:underline"
                >
                  <ExternalLink className="h-3 w-3" /> Full view
                </a>
              )}
            </div>

            {current.receipt_url ? (
              <div className="relative group overflow-hidden rounded-md border border-edge bg-inset flex items-center justify-center p-2 min-h-[240px] max-h-[340px]">
                <img
                  src={current.receipt_url}
                  alt={`Proof of payment for ${residentName}`}
                  className="max-h-[320px] w-auto object-contain rounded"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.onerror = null;
                    target.src = "";
                    target.alt = "Unable to load receipt image.";
                  }}
                />
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-edge bg-inset p-8 text-center text-xs text-muted space-y-1">
                <p className="font-medium text-fg">No screenshot attached</p>
                <p className="text-[11px]">
                  Resident submitted reference: <strong>{paymentRef}</strong>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
