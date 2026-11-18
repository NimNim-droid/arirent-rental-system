import { useState, useEffect } from "react";
import {
  CheckCircle,
  AlertTriangle,
  Receipt,
  Banknote,
  ShieldCheck,
  ExternalLink,
  Smartphone,
  Building2,
  CreditCard,
  QrCode,
  ArrowLeft,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/formatters";
import { compressImage } from "@/lib/image";
import { billingService, type XenditCheckoutSession } from "@/lib/services/billing";
import { getErrorMessage } from "@/lib/errors";
import type { Bill, Settings } from "@/lib/types";

interface GCashPaymentModalProps {
  open: boolean;
  onClose: () => void;
  invoice: Bill | null;
  settings: Settings | null;
  onPaymentSuccess?: () => void | Promise<void>;
}

const SIMULATOR_CHANNELS = [
  { id: "GCASH", label: "GCash", category: "E-Wallet" },
  { id: "MAYA", label: "Maya", category: "E-Wallet" },
  { id: "BDO", label: "BDO Online", category: "Bank Transfer" },
  { id: "BPI", label: "BPI Online", category: "Bank Transfer" },
  { id: "UNIONBANK", label: "UnionBank", category: "Bank Transfer" },
  { id: "CREDIT_CARD", label: "Visa / Mastercard", category: "Card" },
  { id: "QRPH", label: "QR Ph", category: "Universal QR" },
] as const;

export function GCashPaymentModal({
  open,
  onClose,
  invoice,
  settings,
  onPaymentSuccess,
}: GCashPaymentModalProps) {
  const [amount, setAmount] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [paymentMsg, setPaymentMsg] = useState("");
  const [paymentError, setPaymentError] = useState("");

  // Optional Manual Fallback State
  const [showManualFallback, setShowManualFallback] = useState(false);
  const [manualMethod, setManualMethod] = useState<"gcash" | "maya" | "bank_transfer">("gcash");
  const [gcashRef, setGcashRef] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);

  // Built-in Xendit Sandbox Simulator State (used when XENDIT_SECRET_KEY is not yet configured in .env)
  const [simulatorSession, setSimulatorSession] = useState<XenditCheckoutSession | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string>("GCASH");

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
      setShowManualFallback(false);
      setSimulatorSession(null);
      setSelectedChannel("GCASH");
    }
  }, [invoice, open]);

  if (!open || !invoice) return null;

  const handleClose = () => {
    setGcashRef("");
    setReceipt(null);
    setPaymentMsg("");
    setPaymentError("");
    setAmount("");
    setShowManualFallback(false);
    setSimulatorSession(null);
    onClose();
  };

  const validateAmount = (): number | null => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setPaymentError("Please enter a valid payment amount greater than zero.");
      return null;
    }

    if (numAmount > remaining + 0.05) {
      setPaymentError(`Payment amount cannot exceed the remaining balance of ${formatCurrency(remaining)}.`);
      return null;
    }

    return numAmount;
  };

  const handleXenditCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError("");

    const numAmount = validateAmount();
    if (numAmount === null) return;

    setSubmitting(true);
    try {
      const session = await billingService.createXenditCheckout(invoice.id, {
        amount: numAmount,
        redirect_origin: window.location.origin,
      });

      if (session.mode === "live_api") {
        // Redirect browser to Xendit's Hosted Checkout Page
        window.location.assign(session.checkout_url);
        return;
      }

      // Open built-in Xendit Sandbox Simulator when XENDIT_SECRET_KEY is not set yet
      setSimulatorSession(session);
    } catch (err) {
      setPaymentError(getErrorMessage(err, "Unable to start online checkout."));
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
        payment_channel: selectedChannel,
      });
      setSimulatorSession(null);
      setPaymentMsg(res.message);
      if (onPaymentSuccess) {
        await onPaymentSuccess();
      }
    } catch (err) {
      setPaymentError(getErrorMessage(err, "Unable to confirm simulated payment."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError("");

    const numAmount = validateAmount();
    if (numAmount === null) return;

    setSubmitting(true);
    try {
      const finalReceipt = receipt ? await compressImage(receipt) : undefined;
      const msg = await billingService.submitPayment(invoice.id, {
        gcash_ref: gcashRef,
        payment_method: manualMethod,
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
      title={
        simulatorSession
          ? "Xendit Checkout (Test Simulator)"
          : `Pay Invoice #${invoice.id}`
      }
      footer={
        paymentMsg ? (
          <Button type="button" onClick={handleClose}>
            Done
          </Button>
        ) : simulatorSession ? (
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setSimulatorSession(null)}
              disabled={submitting}
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={handleConfirmSimulatorPayment}
              loading={submitting}
            >
              {!submitting && `Pay ${formatCurrency(simulatorSession.amount)} via ${selectedChannel}`}
            </Button>
          </>
        ) : showManualFallback ? (
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowManualFallback(false)}
            >
              Back to Online Checkout
            </Button>
            <Button type="submit" form="manual-payment-form" loading={submitting}>
              {!submitting && "Submit for Verification"}
            </Button>
          </>
        ) : (
          <>
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" form="xendit-checkout-form" loading={submitting}>
              {!submitting && (
                <span className="inline-flex items-center gap-1.5">
                  Proceed to Online Checkout <ExternalLink className="h-3.5 w-3.5" />
                </span>
              )}
            </Button>
          </>
        )
      }
    >
      {paymentMsg ? (
        <div className="space-y-3 py-6 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-success-fg" />
          <h3 className="text-sm font-bold text-fg">Payment Recorded</h3>
          <p className="text-xs text-muted">{paymentMsg}</p>
        </div>
      ) : simulatorSession ? (
        <div className="space-y-4">
          {paymentError && (
            <div className="flex items-center gap-2 rounded-md border border-danger-border bg-danger-bg p-3 text-xs text-danger-fg">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{paymentError}</span>
            </div>
          )}

          <div className="rounded-xl border border-accent-border bg-accent-soft p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
                Xendit Reference: {simulatorSession.invoice_id}
              </p>
              <p className="text-lg font-extrabold text-fg tabular-nums mt-0.5">
                {formatCurrency(simulatorSession.amount)}
              </p>
            </div>
            <span className="rounded-full bg-card border border-edge px-2.5 py-1 text-[10px] font-bold uppercase text-accent">
              Sandbox Mode
            </span>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-fg">
              Select payment channel to simulate:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {SIMULATOR_CHANNELS.map((ch) => {
                const active = selectedChannel === ch.id;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setSelectedChannel(ch.id)}
                    className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition-all cursor-pointer ${
                      active
                        ? "border-accent bg-accent-soft/60 ring-2 ring-accent/20"
                        : "border-edge bg-card hover:border-edge-strong"
                    }`}
                  >
                    <span className="text-xs font-bold text-fg">{ch.label}</span>
                    <span className="text-[10px] text-muted">{ch.category}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-[11px] text-muted leading-relaxed">
            Tip: Add <code className="rounded bg-inset px-1 py-0.5 text-fg">XENDIT_SECRET_KEY</code> in your backend <code className="rounded bg-inset px-1 py-0.5 text-fg">.env</code> or Render settings to redirect to Xendit&apos;s live hosted checkout page.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {paymentError && (
            <div className="flex items-center gap-2 rounded-md border border-danger-border bg-danger-bg p-3 text-xs text-danger-fg">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{paymentError}</span>
            </div>
          )}

          {/* Balance Breakdown Card */}
          <div className="rounded-xl border border-accent-border bg-accent-soft p-3.5 space-y-2">
            <div className="flex justify-between items-center text-xs text-muted">
              <span>Total invoiced</span>
              <span className="font-medium tabular-nums text-fg">{formatCurrency(invoice.total_amount)}</span>
            </div>
            {paid > 0 && (
              <div className="flex justify-between items-center text-xs text-success-fg">
                <span>Previously paid</span>
                <span className="font-medium tabular-nums">−{formatCurrency(paid)}</span>
              </div>
            )}
            <div className="border-t border-accent/20 pt-2 flex justify-between items-center">
              <div>
                <p className="text-[11px] font-medium text-accent">
                  Remaining balance
                </p>
                <p className="text-lg font-semibold text-fg tabular-nums">
                  {formatCurrency(remaining)}
                </p>
              </div>
              {paid > 0 && (
                <span className="text-[11px] font-medium px-1.5 py-0.5 rounded border border-accent-border bg-card text-accent">
                  Partially paid
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

            <div className="relative flex items-center rounded-md border border-edge bg-card transition-colors focus-within:border-accent focus-within:bg-card focus-within:ring-2 focus-within:ring-accent/20">
              <span className="select-none pl-3 text-sm font-medium text-muted">₱</span>
              <input
                id="pay-amount"
                type="number"
                step="0.01"
                min="1"
                max={remaining}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-transparent py-1.5 pl-2 pr-3 text-[13px] font-medium tabular-nums text-fg focus:outline-none"
                required
              />
            </div>
          </div>

          {!showManualFallback ? (
            <form id="xendit-checkout-form" onSubmit={handleXenditCheckout} className="space-y-3.5">
              {/* Supported Xendit Payment Methods Overview */}
              <div className="rounded-xl border border-edge bg-inset p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-fg">
                    <ShieldCheck className="h-4 w-4 text-accent" />
                    Online Checkout via Xendit
                  </span>
                  <span className="rounded-md bg-card border border-edge px-2 py-0.5 text-[10px] font-semibold text-muted">
                    Instant Confirmation
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg border border-edge bg-card p-2.5 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-fg">
                      <Smartphone className="h-3.5 w-3.5 text-accent" />
                      <span>E-Wallets</span>
                    </div>
                    <p className="text-[11px] text-muted">GCash, Maya, GrabPay, ShopeePay</p>
                  </div>

                  <div className="rounded-lg border border-edge bg-card p-2.5 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-fg">
                      <Building2 className="h-3.5 w-3.5 text-accent" />
                      <span>Bank Transfer</span>
                    </div>
                    <p className="text-[11px] text-muted">BDO, BPI, UnionBank, RCBC</p>
                  </div>

                  <div className="rounded-lg border border-edge bg-card p-2.5 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-fg">
                      <CreditCard className="h-3.5 w-3.5 text-accent" />
                      <span>Cards</span>
                    </div>
                    <p className="text-[11px] text-muted">Visa, Mastercard, JCB</p>
                  </div>

                  <div className="rounded-lg border border-edge bg-card p-2.5 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-fg">
                      <QrCode className="h-3.5 w-3.5 text-accent" />
                      <span>QR Ph</span>
                    </div>
                    <p className="text-[11px] text-muted">Any QR Ph banking or wallet app</p>
                  </div>
                </div>

                <p className="text-[11px] text-muted leading-relaxed">
                  Click <strong>Proceed to Online Checkout</strong> to choose your payment method on Xendit. Your invoice balance updates automatically once completed.
                </p>
              </div>

              <div className="text-center pt-0.5">
                <button
                  type="button"
                  onClick={() => setShowManualFallback(true)}
                  className="text-[11px] font-medium text-muted hover:text-fg underline underline-offset-2 cursor-pointer"
                >
                  Already transferred manually? Submit reference number instead
                </button>
              </div>
            </form>
          ) : (
            <form id="manual-payment-form" onSubmit={handleManualSubmit} className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-fg">Manual Transfer Verification</span>
                <button
                  type="button"
                  onClick={() => setShowManualFallback(false)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline cursor-pointer"
                >
                  <ArrowLeft className="h-3 w-3" /> Use Online Checkout
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-inset p-1 border border-edge">
                {(
                  [
                    { id: "gcash", label: "GCash" },
                    { id: "maya", label: "Maya" },
                    { id: "bank_transfer", label: "Bank Transfer" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setManualMethod(tab.id)}
                    className={`rounded-lg py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                      manualMethod === tab.id
                        ? "bg-card text-fg shadow-soft border border-edge"
                        : "text-muted hover:text-fg"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="space-y-1 rounded-md border border-edge bg-inset p-3 text-xs">
                <p className="font-medium text-fg">
                  Account name: {settings?.gcash_name ?? "AriRent Property Management"}
                </p>
                <p className="font-medium text-fg">
                  Account / Mobile No.: {settings?.gcash_number ?? "—"}
                </p>
              </div>

              <Input
                id="ref"
                label="Transaction Reference No."
                placeholder="e.g. 1002 9938 1827"
                value={gcashRef}
                onChange={(e) => setGcashRef(e.target.value)}
                required
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-fg-soft">
                  Upload receipt screenshot (optional)
                </label>
                <label
                  htmlFor="receipt-upload"
                  className="block cursor-pointer rounded-md border border-dashed border-edge-strong p-3.5 text-center transition-colors duration-150 hover:border-accent hover:bg-accent-soft/40"
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
                  <Receipt className="mx-auto mb-1 h-5 w-5 text-muted" />
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
                        className="text-xs text-danger-fg font-medium hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted">
                      Click to upload JPG, PNG, WebP, or PDF receipt (Max 10MB)
                    </p>
                  )}
                </label>
              </div>
            </form>
          )}
        </div>
      )}
    </Modal>
  );
}
