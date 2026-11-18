import { useState, useEffect } from "react";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, formatInvoiceNumber } from "@/lib/formatters";
import { billingService, type XenditCheckoutSession } from "@/lib/services/billing";
import { getErrorMessage } from "@/lib/errors";
import type { Bill, Settings } from "@/lib/types";

interface GCashPaymentModalProps {
  open: boolean;
  onClose: () => void;
  invoice: Bill | null;
  settings?: Settings | null;
  onPaymentSuccess?: () => void | Promise<void>;
}

const PAYMENT_OPTIONS = [
  { id: "gcash", label: "GCash", sub: "E-Wallet", simChannel: "GCASH" },
  { id: "maya", label: "Maya", sub: "E-Wallet", simChannel: "MAYA" },
  { id: "bank_transfer", label: "Bank Transfer", sub: "BDO · BPI · UnionBank", simChannel: "BDO" },
  { id: "card", label: "Card", sub: "Visa · Mastercard", simChannel: "CREDIT_CARD" },
] as const;

type PreferredMethodId = (typeof PAYMENT_OPTIONS)[number]["id"];

export function GCashPaymentModal({
  open,
  onClose,
  invoice,
  onPaymentSuccess,
}: GCashPaymentModalProps) {
  const [amount, setAmount] = useState<string>("");
  const [preferredMethod, setPreferredMethod] = useState<PreferredMethodId>("gcash");
  const [submitting, setSubmitting] = useState(false);
  const [paymentMsg, setPaymentMsg] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [simulatorSession, setSimulatorSession] = useState<XenditCheckoutSession | null>(null);

  const paid = invoice?.paid_amount ?? 0;
  const remaining = invoice
    ? (invoice.remaining_balance ?? Math.max(0, invoice.total_amount - paid))
    : 0;

  useEffect(() => {
    if (invoice && open) {
      const rem = invoice.remaining_balance ?? Math.max(0, invoice.total_amount - (invoice.paid_amount ?? 0));
      setAmount(rem > 0 ? rem.toFixed(2) : invoice.total_amount.toFixed(2));
      setPreferredMethod("gcash");
      setPaymentMsg("");
      setPaymentError("");
      setSimulatorSession(null);
    }
  }, [invoice, open]);

  if (!open || !invoice) return null;

  const invoiceNo = formatInvoiceNumber(invoice.id, invoice.date || invoice.due_date);
  const roomTitle = invoice.room ? `Room ${invoice.room}` : "Unit";
  const parsedAmount = parseFloat(amount);
  const validDisplayAmount =
    !isNaN(parsedAmount) && parsedAmount > 0 ? formatCurrency(parsedAmount) : formatCurrency(remaining);

  const activeOption = PAYMENT_OPTIONS.find((o) => o.id === preferredMethod) ?? PAYMENT_OPTIONS[0];

  const handleClose = () => {
    setPaymentMsg("");
    setPaymentError("");
    setAmount("");
    setSimulatorSession(null);
    onClose();
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError("");

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setPaymentError("Enter a valid payment amount.");
      return;
    }

    if (numAmount > remaining + 0.05) {
      setPaymentError(`Amount cannot exceed ${formatCurrency(remaining)}.`);
      return;
    }

    setSubmitting(true);
    try {
      const session = await billingService.createXenditCheckout(invoice.id, {
        amount: numAmount,
        redirect_origin: window.location.origin,
        preferred_method: preferredMethod,
      });

      if (session.mode === "live_api") {
        window.location.assign(session.checkout_url);
        return;
      }

      setSimulatorSession(session);
    } catch (err) {
      setPaymentError(getErrorMessage(err, "Unable to start payment."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmSimulatorPayment = async () => {
    if (!simulatorSession) return;
    setPaymentError("");
    setSubmitting(true);
    try {
      const res = await billingService.verifyXenditPayment(invoice.id, {
        invoice_id: simulatorSession.invoice_id,
        external_id: simulatorSession.external_id,
        payment_channel: activeOption.simChannel,
      });
      setSimulatorSession(null);
      setPaymentMsg(res.message);
      if (onPaymentSuccess) {
        await onPaymentSuccess();
      }
    } catch (err) {
      setPaymentError(getErrorMessage(err, "Unable to confirm payment."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} hideHeader maxWidth="sm">
      {paymentMsg ? (
        <div className="space-y-4 py-4 text-center">
          <CheckCircle className="mx-auto h-10 w-10 text-success-fg" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-fg">Payment confirmed</h3>
            <p className="text-xs text-muted">{paymentMsg}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex w-full items-center justify-center rounded-2xl bg-[#14233F] dark:bg-[#1D3560] py-3.5 px-4 text-sm font-bold text-white shadow-soft transition-all hover:opacity-95 active:scale-95 cursor-pointer"
          >
            Done
          </button>
        </div>
      ) : simulatorSession ? (
        <div className="space-y-4 pt-1 pb-1">
          <div className="space-y-0.5">
            <h2 className="text-lg font-bold tracking-tight text-fg">
              Confirm {activeOption.label} payment
            </h2>
            <p className="text-xs text-muted font-medium">
              {invoiceNo} · {formatCurrency(simulatorSession.amount)}
            </p>
          </div>

          {paymentError && (
            <div className="flex items-center gap-2 rounded-xl border border-danger-border bg-danger-bg p-3 text-xs text-danger-fg">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{paymentError}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleConfirmSimulatorPayment}
            disabled={submitting}
            className="flex w-full items-center justify-center rounded-2xl bg-[#14233F] dark:bg-[#1D3560] py-3.5 px-4 text-sm font-bold text-white shadow-soft transition-all hover:opacity-95 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {submitting
              ? "Processing..."
              : `Pay ${formatCurrency(simulatorSession.amount)} with ${activeOption.label}`}
          </button>
        </div>
      ) : (
        <form onSubmit={handleCheckoutSubmit} className="space-y-4 pt-1 pb-1">
          {/* Header matching TenantStatementModal */}
          <div className="space-y-0.5">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-fg">
              Pay invoice
            </h2>
            <p className="text-xs text-muted font-medium">
              {invoiceNo} · {roomTitle}
            </p>
          </div>

          {paymentError && (
            <div className="flex items-center gap-2 rounded-xl border border-danger-border bg-danger-bg p-3 text-xs text-danger-fg">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{paymentError}</span>
            </div>
          )}

          {/* Clean Balance Summary */}
          <div className="divide-y divide-edge/60 border-t border-b border-edge/60 py-1 text-[13px] sm:text-sm">
            {paid > 0 && (
              <>
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted font-medium">Total bill</span>
                  <span className="font-semibold text-fg tabular-nums">
                    {formatCurrency(invoice.total_amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted font-medium">Paid so far</span>
                  <span className="font-semibold text-success-fg tabular-nums">
                    −{formatCurrency(paid)}
                  </span>
                </div>
              </>
            )}
            <div className="flex items-center justify-between py-2.5">
              <span className="text-muted font-medium">Balance due</span>
              <span className="text-base font-extrabold text-fg tabular-nums">
                {formatCurrency(remaining)}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-1.5">
            <span className="block text-xs font-medium text-muted">
              Payment method
            </span>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_OPTIONS.map((opt) => {
                const selected = preferredMethod === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPreferredMethod(opt.id)}
                    className={`flex flex-col items-start rounded-xl border px-3 py-2.5 text-left transition-all cursor-pointer ${
                      selected
                        ? "border-[#14233F] bg-[#14233F]/5 dark:border-[#4B74B8] dark:bg-[#1D3560]/25"
                        : "border-edge bg-card hover:border-edge-strong"
                    }`}
                  >
                    <span className="text-xs font-bold text-fg">{opt.label}</span>
                    <span className="text-[10px] text-muted mt-0.5">{opt.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Simple Payment Amount Input */}
          <div className="space-y-1.5">
            <label htmlFor="pay-amount" className="block text-xs font-medium text-muted">
              Amount to pay
            </label>
            <div className="flex items-center rounded-2xl border border-edge bg-inset/50 px-3.5 py-3 transition-colors focus-within:border-edge-strong focus-within:bg-card">
              <span className="select-none text-base font-bold text-muted">₱</span>
              <input
                id="pay-amount"
                type="number"
                step="0.01"
                min="1"
                max={remaining}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-transparent pl-2 text-base font-extrabold tabular-nums text-fg focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center rounded-2xl bg-[#14233F] dark:bg-[#1D3560] py-3.5 px-4 text-sm font-bold text-white shadow-soft transition-all hover:opacity-95 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {submitting
                ? "Opening checkout..."
                : `Pay ${validDisplayAmount} with ${activeOption.label}`}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
