import { useState } from "react";
import { DollarSign } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatCurrency } from "@/lib/formatters";
import { billingService } from "@/lib/services/billing";
import type { Bill } from "@/lib/types";

interface DirectPaymentModalProps {
  invoice: Bill | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function DirectPaymentModal({ invoice, onClose, onSuccess }: DirectPaymentModalProps) {
  const [amount, setAmount] = useState<string>("");
  const [method, setMethod] = useState<string>("cash");
  const [ref, setRef] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!invoice) return null;

  const remaining = invoice.remaining_balance ?? invoice.total_amount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = amount ? parseFloat(amount) : remaining;
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid payment amount greater than zero.");
      return;
    }

    if (numAmount > remaining) {
      setError(`Payment cannot exceed remaining balance of ${formatCurrency(remaining)}`);
      return;
    }

    setLoading(true);
    try {
      await billingService.recordDirectPayment(invoice.id, {
        amount: numAmount,
        payment_method: method,
        transaction_reference: ref || undefined,
        notes: notes || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to record payment.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={!!invoice}
      onClose={onClose}
      title={`Record Direct Payment — Invoice #${invoice.id}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            <DollarSign className="h-4 w-4" /> Confirm Payment
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <div className="rounded-xl border border-edge bg-inset p-3.5 space-y-1.5">
          <div className="flex justify-between text-xs text-muted">
            <span>Resident</span>
            <span className="font-semibold text-fg">{invoice.tenant_name} (Room {invoice.room})</span>
          </div>
          <div className="flex justify-between text-xs text-muted">
            <span>Total Bill</span>
            <span className="font-semibold text-fg tabular-nums">{formatCurrency(invoice.total_amount)}</span>
          </div>
          <div className="flex justify-between text-xs text-muted">
            <span>Already Paid</span>
            <span className="font-semibold text-success tabular-nums">{formatCurrency(invoice.paid_amount ?? 0)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-fg border-t border-edge pt-2">
            <span>Remaining Balance</span>
            <span className="text-accent tabular-nums">{formatCurrency(remaining)}</span>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-danger/10 border border-danger/30 p-2.5 text-xs text-danger-fg font-medium">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-fg">Payment Amount (₱)</label>
          <Input
            type="number"
            step="0.01"
            min="1"
            max={remaining}
            placeholder={`Full balance: ${remaining}`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <p className="text-[11px] text-muted">
            Leave blank to settle the entire balance of {formatCurrency(remaining)}, or enter custom partial amount.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-fg">Payment Channel</label>
          <Select value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="cash">Cash (In-Person Office)</option>
            <option value="bank_transfer">Bank Transfer (BDO / BPI / Maya)</option>
            <option value="gcash">Manual GCash Direct</option>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-fg">Reference Number (Optional)</label>
          <Input
            type="text"
            placeholder="e.g. BDO-982312 or Cash Receipt #104"
            value={ref}
            onChange={(e) => setRef(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-fg">Notes / Remarks</label>
          <Input
            type="text"
            placeholder="e.g. Received by landlord at front desk"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}
