import { useState, type FormEvent } from "react";
import { billingService } from "@/lib/services/billing";
import { getErrorMessage } from "@/lib/errors";
import { formatCurrency } from "@/lib/formatters";
import type { Bill } from "@/lib/types";

interface UseDirectPaymentFormProps {
  invoice: Bill | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function useDirectPaymentForm({
  invoice,
  onClose,
  onSuccess,
}: UseDirectPaymentFormProps) {
  const [amount, setAmount] = useState<string>("");
  const [method, setMethod] = useState<string>("cash");
  const [ref, setRef] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = invoice ? invoice.remaining_balance ?? invoice.total_amount : 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

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
      setError(getErrorMessage(err, "Failed to record payment."));
    } finally {
      setLoading(false);
    }
  };

  return {
    amount,
    setAmount,
    method,
    setMethod,
    ref,
    setRef,
    notes,
    setNotes,
    loading,
    error,
    remaining,
    handleSubmit,
  };
}

