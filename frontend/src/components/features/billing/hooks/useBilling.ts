import { useCallback, useEffect, useMemo, useState } from "react";
import { billingService } from "@/lib/services/billing";
import { excessChargesService } from "@/lib/services/excess-charges";
import { propertiesService } from "@/lib/services/properties";
import { tenantsService } from "@/lib/services/tenants";
import { getErrorMessage } from "@/lib/errors";
import type { Bill, DelinquentTenant, ExcessCharge, Property, Tenant } from "@/lib/types";

interface UseBillingOptions {
  includeExcessCharges?: boolean;
  includeDelinquencies?: boolean;
}

export function useBilling(options: UseBillingOptions = {}) {
  const { includeExcessCharges = false, includeDelinquencies = false } = options;

  const [bills, setBills] = useState<Bill[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [activeTenants, setActiveTenants] = useState<Tenant[]>([]);
  const [excessCharges, setExcessCharges] = useState<ExcessCharge[]>([]);
  const [delinquents, setDelinquents] = useState<DelinquentTenant[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Bill | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [excessError, setExcessError] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingCharges, setLoadingCharges] = useState(false);
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

  const loadProperties = useCallback(async () => {
    try {
      const data = await propertiesService.getProperties();
      setProperties(data);
    } catch {
      // Non-blocking
    }
  }, []);

  const loadActiveTenants = useCallback(async () => {
    try {
      const res = await tenantsService.getTenants({ status: "active", per_page: 150 });
      setActiveTenants(res.data);
    } catch {
      // Non-blocking
    }
  }, []);

  const loadExcessCharges = useCallback(async () => {
    setLoadingCharges(true);
    setExcessError("");
    try {
      const data = await excessChargesService.getCharges({ status: "pending" });
      setExcessCharges(data);
    } catch {
      setExcessError("Failed to load pending unbilled charges.");
    } finally {
      setLoadingCharges(false);
    }
  }, []);

  const loadDelinquencies = useCallback(async () => {
    try {
      const res = await billingService.getDelinquencies();
      setDelinquents(res.data);
    } catch {
      // Delinquency check non-blocking
    }
  }, []);

  useEffect(() => {
    void loadBills();
    void loadProperties();
    void loadActiveTenants();
    if (includeExcessCharges) {
      void loadExcessCharges();
    }
    if (includeDelinquencies) {
      void loadDelinquencies();
    }
  }, [
    loadBills,
    loadProperties,
    loadActiveTenants,
    loadExcessCharges,
    loadDelinquencies,
    includeExcessCharges,
    includeDelinquencies,
  ]);

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
          : rejectReason || "Payment rejected by the property manager.",
      });
      setMessage(resMsg);
      await loadBills();
      if (includeDelinquencies) {
        await loadDelinquencies();
      }
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
      if (includeExcessCharges) {
        await loadExcessCharges();
      }
    } catch (err) {
      setError(getErrorMessage(err, "Unable to cancel the bill."));
    } finally {
      setBusyId(null);
    }
  };

  const deleteExcessCharge = async (id: string): Promise<boolean> => {
    setExcessError("");
    try {
      await excessChargesService.deleteCharge(id);
      await loadExcessCharges();
      return true;
    } catch (err) {
      setExcessError(getErrorMessage(err, "Failed to remove incidental charge."));
      return false;
    }
  };

  const deleteBill = async (id: string): Promise<void> => {
    await billingService.deleteBill(id);
    await loadBills();
    if (includeDelinquencies) {
      await loadDelinquencies();
    }
  };

  const bulkDeleteBills = async (ids: string[]) => {
    const res = await billingService.bulkDeleteBills(ids);
    await loadBills();
    if (includeDelinquencies) {
      await loadDelinquencies();
    }
    return res;
  };

  return {
    bills,
    properties,
    activeTenants,
    excessCharges,
    delinquents,
    pendingPayments,
    selectedInvoice,
    message,
    error,
    excessError,
    loading,
    loadingCharges,
    generating,
    busyId,
    setSelectedInvoice,
    loadBills,
    loadExcessCharges,
    loadDelinquencies,
    handleGenerateBills,
    runVerify,
    handleVoid,
    deleteExcessCharge,
    deleteBill,
    bulkDeleteBills,
    clearMessage: () => setMessage(""),
    clearError: () => setError(""),
  };
}
