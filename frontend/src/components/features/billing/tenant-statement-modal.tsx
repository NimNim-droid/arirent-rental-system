import { AlertTriangle, CheckCircle, Clock, Ban } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters";
import type { Bill } from "@/lib/types";

interface TenantStatementModalProps {
  open: boolean;
  onClose: () => void;
  invoice: Bill | null;
  onPayGCash?: (invoice: Bill) => void;
}

export function TenantStatementModal({
  open,
  onClose,
  invoice,
  onPayGCash,
}: TenantStatementModalProps) {
  if (!open || !invoice) return null;

  const isUnpaid = invoice.status === "unpaid";
  const isVoided = invoice.status === "voided";
  const isPending = invoice.status === "pending_verification";
  const isPaid = invoice.status === "paid";

  const getStatusBadge = () => {
    if (isPaid) return <Badge dot variant="success">Paid</Badge>;
    if (isPending) return <Badge dot variant="warning">Pending Approval</Badge>;
    if (isVoided) return <Badge dot variant="neutral">Voided / Canceled</Badge>;
    return <Badge dot variant="danger">Unpaid</Badge>;
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Invoice Statement — #${invoice.id}`}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
          {isUnpaid && onPayGCash && (
            <Button
              type="button"
              onClick={() => {
                onClose();
                onPayGCash(invoice);
              }}
            >
              Pay via GCash
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        {/* Rejection Notice Banner */}
        {isUnpaid && invoice.reject_reason && (
          <div className="rounded-xl border border-danger-border bg-danger-bg p-3.5 text-xs text-danger-fg space-y-1.5 animate-fade-in">
            <div className="font-bold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-danger-fg" />
              <span>Payment Verification Rejected</span>
            </div>
            <p className="leading-relaxed">
              <strong>Reason:</strong> {invoice.reject_reason}
            </p>
            <p className="text-[11px] text-danger-fg/85 pt-0.5">
              Please click &quot;Pay via GCash&quot; below to re-enter your reference number or upload a clearer receipt screenshot.
            </p>
          </div>
        )}

        {/* Voided Notice Banner */}
        {isVoided && (
          <div className="rounded-xl border border-edge bg-inset p-3.5 text-xs text-muted flex items-center gap-2.5">
            <Ban className="h-4 w-4 shrink-0 text-faint" />
            <span>This invoice was voided by management. No payment is required.</span>
          </div>
        )}

        {/* Pending Notice Banner */}
        {isPending && (
          <div className="rounded-xl border border-warning-border bg-warning-bg p-3.5 text-xs text-warning-fg space-y-1">
            <div className="font-bold flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0 text-warning-fg" />
              <span>Payment Under Review</span>
            </div>
            <p>
              Your GCash reference <strong>{invoice.gcash_ref}</strong> has been submitted. The landlord will confirm your payment shortly.
            </p>
          </div>
        )}

        {/* Invoice Metadata Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-edge bg-inset p-3">
            <p className="text-muted">Invoice Number</p>
            <p className="mt-0.5 font-bold text-fg font-mono">#{invoice.id}</p>
          </div>
          <div className="rounded-xl border border-edge bg-inset p-3">
            <p className="text-muted">Due Date</p>
            <p className="mt-0.5 font-bold text-fg">{invoice.due_date}</p>
            {invoice.notes && (
              <p className="text-[10px] text-muted mt-0.5 leading-tight">{invoice.notes}</p>
            )}
          </div>
        </div>

        {/* Billing Breakdown */}
        <div className="space-y-2 rounded-2xl border border-edge p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
            Billing Breakdown
          </p>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">Monthly Rent</span>
            <span className="font-semibold text-fg tabular-nums">
              {formatCurrency(invoice.rent)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">Electricity</span>
            <span className="font-semibold text-fg tabular-nums">
              {formatCurrency(invoice.electricity)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">Water</span>
            <span className="font-semibold text-fg tabular-nums">
              {formatCurrency(invoice.water)}
            </span>
          </div>
          {invoice.late_fee > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">Late Fee</span>
              <span className="font-semibold text-danger-fg tabular-nums">
                {formatCurrency(invoice.late_fee)}
              </span>
            </div>
          )}
          <div className="mt-2 flex items-center justify-between border-t border-edge pt-2 text-sm">
            <span className="font-bold text-fg">
              {isVoided ? "Original Total (Voided)" : "Total Amount Due"}
            </span>
            <span className="font-extrabold text-fg tabular-nums">
              {formatCurrency(invoice.total_amount)}
            </span>
          </div>
        </div>

        {/* Status Row */}
        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-muted">Payment Status</span>
          {getStatusBadge()}
        </div>

        {/* Paid Confirmation Details */}
        {isPaid && (
          <div className="rounded-xl border border-success-border bg-success-bg p-3 text-xs text-success-fg flex items-center gap-2">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>
              Payment settled on {invoice.approved_date || invoice.payment_date || "record"}.
            </span>
          </div>
        )}
      </div>
    </Modal>
  );
}
