import { useCallback, useEffect, useMemo, useState } from "react";
import { billingService } from "@/lib/services/billing";
import { getErrorMessage } from "@/lib/errors";
import type { Bill } from "@/lib/types";

export function useBilling() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Bill | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadBills = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await billingService.getBills({ per_page: 200 });
      setBills(res.data);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load invoices."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBills();
  }, [loadBills]);

  const pendingPayments = useMemo(
    () => bills.filter((b) => b.status === "pending_verification"),
    [bills]
  );

  const handleGenerateBills = async () => {
    setGenerating(true);
    setError("");
    setMessage("");
    try {
      const res = await billingService.generateBills();
      setMessage(res.message);
      await loadBills();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to generate bills."));
    } finally {
      setGenerating(false);
    }
  };

  const runVerify = async (id: string, approved: boolean, rejectReason?: string) => {
    setBusyId(id);
    setError("");
    setMessage("");
    try {
      const resMsg = await billingService.verifyPayment(id, {
        approved,
        reject_reason: approved
          ? undefined
          : (rejectReason || "Payment rejected by the property manager."),
      });
      setMessage(resMsg);
      await loadBills();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to verify payment."));
    } finally {
      setBusyId(null);
    }
  };

  const handleVoid = async (id: string) => {
    setBusyId(id);
    setError("");
    setMessage("");
    try {
      await billingService.voidBill(id);
      setMessage("Bill cancelled successfully.");
      await loadBills();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to cancel the bill."));
    } finally {
      setBusyId(null);
    }
  };

  return {
    bills,
    pendingPayments,
    selectedInvoice,
    message,
    error,
    loading,
    generating,
    busyId,
    setSelectedInvoice,
    loadBills,
    handleGenerateBills,
    runVerify,
    handleVoid,
    clearMessage: () => setMessage(""),
    clearError: () => setError(""),
  };
}
