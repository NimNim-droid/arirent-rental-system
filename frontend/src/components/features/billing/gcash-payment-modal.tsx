import { useState, useEffect } from "react";
import { CheckCircle, AlertTriangle, Receipt, Banknote } from "lucide-react";
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
  const [amount, setAmount] = useState<string>("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMsg, setPaymentMsg] = useState("");
  const [paymentError, setPaymentError] = useState("");

  const paid = invoice?.paid_amount ?? 0;
  const remaining = invoice
    ? (invoice.remaining_balance ?? Math.max(0, invoice.total_amount - paid))
    : 0;

  useEffect(() => {
    if (invoice && open) {
      const rem = invoice.remaining_balance ?? Math.max(0, invoice.total_amount - (invoice.paid_amount ?? 0));
      setAmount(rem > 0 ? rem.toFixed(2) : invoice.total_amount.toFixed(2));
      setGcashRef("");
      setReceipt(null);
      setPaymentMsg("");
      setPaymentError("");
    }
  }, [invoice, open]);

  if (!open || !invoice) return null;

  const handleClose = () => {
    setGcashRef("");
    setReceipt(null);
    setPaymentMsg("");
    setPaymentError("");
    setAmount("");
    onClose();
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError("");

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setPaymentError("Please enter a valid payment amount greater than zero.");
      return;
    }

    if (numAmount > remaining + 0.05) {
      setPaymentError(`Payment amount cannot exceed the remaining balance of ${formatCurrency(remaining)}.`);
      return;
    }

    setSubmitting(true);
    try {
      const finalReceipt = receipt ? await compressImage(receipt) : undefined;
      const msg = await billingService.submitPayment(invoice.id, {
        gcash_ref: gcashRef,
        receipt: finalReceipt,
        amount: numAmount,
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
      title={`Pay Invoice #${invoice.id}`}
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

          {/* Balance Breakdown Card */}
          <div className="rounded-2xl border border-accent-border bg-accent-soft p-4 space-y-2">
            <div className="flex justify-between items-center text-xs text-muted">
              <span>Total Invoiced</span>
              <span className="font-semibold tabular-nums text-fg">{formatCurrency(invoice.total_amount)}</span>
            </div>
            {paid > 0 && (
              <div className="flex justify-between items-center text-xs text-success-fg">
                <span>Previously Paid</span>
                <span className="font-semibold tabular-nums">−{formatCurrency(paid)}</span>
              </div>
            )}
            <div className="border-t border-accent/20 pt-2 flex justify-between items-center">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-accent">
                  Remaining Balance
                </p>
                <p className="text-2xl font-extrabold text-fg tabular-nums">
                  {formatCurrency(remaining)}
                </p>
              </div>
              {paid > 0 && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-accent/20 text-accent">
                  Partially Paid
                </span>
              )}
            </div>
          </div>

          {/* Amount To Pay with quick chips */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="pay-amount" className="text-xs font-semibold text-fg-soft flex items-center gap-1.5">
                <Banknote className="h-3.5 w-3.5 text-accent" /> Amount to Pay (₱)
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setAmount(remaining.toFixed(2))}
                  className="text-[11px] font-medium text-accent hover:underline cursor-pointer"
                >
                  Full ({formatCurrency(remaining)})
                </button>
                {remaining >= 200 && (
                  <>
                    <span className="text-muted text-xs">•</span>
                    <button
                      type="button"
                      onClick={() => setAmount((Math.round(remaining / 2)).toFixed(2))}
                      className="text-[11px] font-medium text-muted hover:text-fg cursor-pointer"
                    >
                      50% ({formatCurrency(Math.round(remaining / 2))})
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="relative flex items-center rounded-xl border border-edge bg-inset transition-all focus-within:border-accent focus-within:bg-card focus-within:ring-3 focus-within:ring-accent/15">
              <span className="select-none pl-3 text-sm font-bold text-muted">₱</span>
              <input
                id="pay-amount"
                type="number"
                step="0.01"
                min="1"
                max={remaining}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-transparent py-2 pl-2 pr-3 text-sm font-bold tabular-nums text-fg focus:outline-none"
                required
              />
            </div>
            <p className="text-[11px] text-muted">
              Enter the exact amount you are sending through GCash for this transaction.
            </p>
          </div>

          <div className="space-y-1.5 rounded-xl border border-edge bg-inset p-3.5 text-xs">
            <p className="font-bold text-fg">
              GCash Account Name: {settings?.gcash_name ?? "—"}
            </p>
            <p className="font-bold text-fg">
              GCash Number: {settings?.gcash_number ?? "—"}
            </p>
            <p className="pt-0.5 text-muted leading-relaxed">
              Please transfer your payment to the official account above, then enter your 13-digit transaction reference number below.
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
