import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { billingService } from "@/lib/services/billing";
import { excessChargesService } from "@/lib/services/excess-charges";
import { settingsService } from "@/lib/services/settings";
import { getErrorMessage } from "@/lib/errors";
import type { Bill, ExcessCharge, Settings } from "@/lib/types";

export interface XenditFeedback {
  tone: "success" | "warning" | "danger";
  message: string;
}

export function useTenantBilling() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [bills, setBills] = useState<Bill[]>([]);
  const [pendingCharges, setPendingCharges] = useState<ExcessCharge[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Bill | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [xenditFeedback, setXenditFeedback] = useState<XenditFeedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBills = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [billsRes, chargesRes] = await Promise.all([
        billingService.getBills({ per_page: 100 }),
        excessChargesService.getCharges({ status: "pending" }).catch(() => [] as ExcessCharge[]),
      ]);
      setBills(billsRes.data);
      setPendingCharges(chargesRes);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load your bills."));
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

  useEffect(() => {
    const xenditStatus = searchParams.get("xendit_status");
    const billId = searchParams.get("bill_id");
    const externalId = searchParams.get("external_id") ?? undefined;

    if (!xenditStatus || !billId) return;

    // Clean query params immediately so page refreshes do not re-run verification
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("xendit_status");
    nextParams.delete("bill_id");
    nextParams.delete("external_id");
    setSearchParams(nextParams, { replace: true });

    if (xenditStatus === "cancelled") {
      setXenditFeedback({
        tone: "warning",
        message: "Online checkout was cancelled. You can retry anytime before the due date.",
      });
      return;
    }

    if (xenditStatus === "success") {
      let active = true;
      (async () => {
        try {
          const res = await billingService.verifyXenditPayment(billId, {
            external_id: externalId,
          });
          if (!active) return;
          setXenditFeedback({
            tone: "success",
            message: res.message || "Online payment confirmed via Xendit!",
          });
          await loadBills();
        } catch (err) {
          if (!active) return;
          setXenditFeedback({
            tone: "danger",
            message: getErrorMessage(err, "Unable to verify Xendit payment status yet."),
          });
        }
      })();
      return () => {
        active = false;
      };
    }
  }, [searchParams, setSearchParams, loadBills]);

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

  const pendingChargesTotal = useMemo(
    () => pendingCharges.reduce((sum, c) => sum + Number(c.amount || 0), 0),
    [pendingCharges]
  );

  return {
    bills,
    pendingCharges,
    pendingChargesTotal,
    settings,
    selectedInvoice,
    showPaymentModal,
    showStatementModal,
    xenditFeedback,
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
