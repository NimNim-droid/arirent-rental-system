import { useState } from "react";
import { CheckCircle, AlertTriangle, Receipt } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/formatters";
import { compressImage } from "@/lib/image";
import { billingService } from "@/lib/services/billing";
import { getErrorMessage } from "@/lib/errors";
import type { Bill, Settings } from "@/lib/types";

interface GCashPaymentModalProps {
  open: boolean;
  onClose: () => void;
  invoice: Bill | null;
  settings: Settings | null;
  onPaymentSuccess?: () => void | Promise<void>;
}

export function GCashPaymentModal({
  open,
  onClose,
  invoice,
  settings,
  onPaymentSuccess,
}: GCashPaymentModalProps) {
  const [gcashRef, setGcashRef] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMsg, setPaymentMsg] = useState("");
  const [paymentError, setPaymentError] = useState("");

  if (!open || !invoice) return null;

  const handleClose = () => {
    setGcashRef("");
    setReceipt(null);
    setPaymentMsg("");
    setPaymentError("");
    onClose();
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setPaymentError("");
    try {
      const finalReceipt = receipt ? await compressImage(receipt) : undefined;
      const msg = await billingService.submitPayment(invoice.id, {
        gcash_ref: gcashRef,
        receipt: finalReceipt,
      });
      setPaymentMsg(msg);
      if (onPaymentSuccess) {
        await onPaymentSuccess();
      }
    } catch (err) {
      setPaymentError(getErrorMessage(err, "Unable to submit your payment."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`Pay Invoice ${invoice.id}`}
      footer={
        paymentMsg ? (
          <Button type="button" onClick={handleClose}>
            Done
          </Button>
        ) : (
          <>
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" form="payment-form" loading={submitting}>
              {!submitting && "Submit for Verification"}
            </Button>
          </>
        )
      }
    >
      {paymentMsg ? (
        <div className="space-y-3 py-6 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-success-fg" />
          <h3 className="text-lg font-bold text-fg">Payment Submitted!</h3>
          <p className="text-xs text-muted">{paymentMsg}</p>
        </div>
      ) : (
        <form id="payment-form" onSubmit={handlePaymentSubmit} className="space-y-4">
          {paymentError && (
            <div className="flex items-center gap-2 rounded-xl border border-danger-border bg-danger-bg p-3 text-xs font-semibold text-danger-fg">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{paymentError}</span>
            </div>
          )}

          <div className="rounded-2xl border border-accent-border bg-accent-soft text-center p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-accent">
              Total Due
            </p>
            <p className="mt-1 text-3xl font-extrabold text-fg tabular-nums">
              {formatCurrency(invoice.total_amount)}
            </p>
          </div>

          <div className="space-y-1.5 rounded-xl border border-edge bg-inset p-4 text-xs">
            <p className="font-bold text-fg">
              GCash Account Name: {settings?.gcash_name ?? "—"}
            </p>
            <p className="font-bold text-fg">
              GCash Number: {settings?.gcash_number ?? "—"}
            </p>
            <p className="pt-1 text-muted">
              Please send the exact amount to the number above, then enter your
              transaction reference number below.
            </p>
          </div>

          <Input
            id="ref"
            label="GCash Reference No."
            placeholder="e.g. 1002 9938 1827"
            value={gcashRef}
            onChange={(e) => setGcashRef(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-fg-soft">
              Upload Receipt Screenshot (Optional)
            </label>
            <label
              htmlFor="receipt-upload"
              className="block cursor-pointer rounded-xl border-2 border-dashed border-edge-strong p-4 text-center transition-all duration-200 hover:border-accent hover:bg-accent-soft/40"
            >
              <input
                id="receipt-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/svg+xml,application/pdf"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  if (file && file.size > 10 * 1024 * 1024) {
                    setPaymentError("The selected file exceeds the 10MB size limit.");
                    return;
                  }
                  setPaymentError("");
                  setReceipt(file);
                }}
              />
              <Receipt className="mx-auto mb-1 h-6 w-6 text-muted" />
              {receipt ? (
                <div className="flex items-center justify-center gap-2">
                  <p className="text-xs font-semibold text-fg truncate max-w-[220px]">
                    {receipt.name}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setReceipt(null);
                    }}
                    className="text-xs text-danger-fg font-bold hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <p className="text-xs text-muted">
                  Click or drag image (JPG, PNG, WebP, SVG) or PDF of GCash receipt (Max 10MB)
                </p>
              )}
            </label>
          </div>
        </form>
      )}
    </Modal>
  );
}
