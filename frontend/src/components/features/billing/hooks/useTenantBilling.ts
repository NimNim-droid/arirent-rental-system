import { useCallback, useEffect, useMemo, useState } from "react";
import { billingService } from "@/lib/services/billing";
import { settingsService } from "@/lib/services/settings";
import { getErrorMessage } from "@/lib/errors";
import type { Bill, Settings } from "@/lib/types";

export function useTenantBilling() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Bill | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBills = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const billsRes = await billingService.getBills({ per_page: 100 });
      setBills(billsRes.data);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load your invoices."));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    if (settings) return;
    try {
      const s = await settingsService.getSettings();
      setSettings(s);
    } catch {
      // Non-critical fallback
    }
  }, [settings]);

  useEffect(() => {
    loadBills();
    loadSettings();
  }, [loadBills, loadSettings]);

  const openPayment = (bill: Bill) => {
    setSelectedInvoice(bill);
    setShowPaymentModal(true);
  };

  const openStatement = (bill: Bill) => {
    setSelectedInvoice(bill);
    setShowStatementModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedInvoice(null);
  };

  const closeStatementModal = () => {
    setShowStatementModal(false);
    setSelectedInvoice(null);
  };

  const unpaidBills = useMemo(
    () => bills.filter((b) => b.status === "unpaid" || b.status === "partially_paid" || b.status === "overdue"),
    [bills]
  );

  const unpaidTotal = useMemo(
    () =>
      unpaidBills.reduce((sum, b) => {
        const remaining = b.remaining_balance ?? Math.max(0, b.total_amount - (b.paid_amount || 0));
        return sum + remaining;
      }, 0),
    [unpaidBills]
  );

  return {
    bills,
    settings,
    selectedInvoice,
    showPaymentModal,
    showStatementModal,
    loading,
    error,
    unpaidBills,
    unpaidTotal,
    loadBills,
    openPayment,
    openStatement,
    closePaymentModal,
    closeStatementModal,
  };
}
