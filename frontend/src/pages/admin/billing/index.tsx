import { useState, useEffect, useCallback, useMemo } from "react";
import { Zap, PlusCircle } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { AlertBanner } from "@/components/ui/alert-banner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  useBilling,
  InvoiceModal,
  ExcessChargeModal,
  DirectPaymentModal,
  BillingFilterBar,
  BillingBillsTable,
  PendingChargesTable,
} from "@/components/features/billing";
import { tenantsService } from "@/lib/services/tenants";
import { excessChargesService } from "@/lib/services/excess-charges";
import { propertiesService } from "@/lib/services/properties";
import { formatCurrency } from "@/lib/formatters";
import type { Tenant, ExcessCharge, Bill, Property } from "@/lib/types";

type BillingTab = "current" | "history" | "unpaid";

export default function AdminBilling() {
  const [activeTab, setActiveTab] = useState<BillingTab>("current");
  const [properties, setProperties] = useState<Property[]>([]);
  const [activeTenants, setActiveTenants] = useState<Tenant[]>([]);
  const [excessCharges, setExcessCharges] = useState<ExcessCharge[]>([]);
  const [loadingCharges, setLoadingCharges] = useState<boolean>(false);
  const [isExcessModalOpen, setIsExcessModalOpen] = useState<boolean>(false);
  const [directPaymentInvoice, setDirectPaymentInvoice] = useState<Bill | null>(null);
  const [deletingCharge, setDeletingCharge] = useState<ExcessCharge | null>(null);
  const [isDeletingCharge, setIsDeletingCharge] = useState<boolean>(false);
  const [voidingBill, setVoidingBill] = useState<Bill | null>(null);
  const [isVoidingBill, setIsVoidingBill] = useState<boolean>(false);
  const [excessError, setExcessError] = useState<string>("");

  // Filters
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  const {
    bills,
    selectedInvoice,
    message,
    error,
    loading,
    generating,
    setSelectedInvoice,
    loadBills,
    handleGenerateBills,
    handleVoid,
  } = useBilling();

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

  useEffect(() => {
    loadProperties();
    loadActiveTenants();
    loadExcessCharges();
  }, [loadProperties, loadActiveTenants, loadExcessCharges]);

  // Dynamic tenant options filtered by selected property
  const visibleTenants = useMemo(() => {
    if (!selectedPropertyId) return activeTenants;
    return activeTenants.filter((t) => String(t.property_id) === String(selectedPropertyId));
  }, [activeTenants, selectedPropertyId]);

  const handlePropertyChange = (propId: string) => {
    setSelectedPropertyId(propId);
    setPage(1);

    if (selectedTenantId && propId) {
      const tenantInProp = activeTenants.some(
        (t) => String(t.id) === String(selectedTenantId) && String(t.property_id) === String(propId)
      );
      if (!tenantInProp) {
        setSelectedTenantId("");
      }
    }
  };

  const handleConfirmVoid = async () => {
    if (!voidingBill) return;
    setIsVoidingBill(true);
    try {
      await handleVoid(String(voidingBill.id));
      setVoidingBill(null);
      await loadExcessCharges();
    } finally {
      setIsVoidingBill(false);
    }
  };

  const handleConfirmDeleteCharge = async () => {
    if (!deletingCharge) return;
    setIsDeletingCharge(true);
    try {
      await excessChargesService.deleteCharge(deletingCharge.id);
      setDeletingCharge(null);
      await loadExcessCharges();
    } catch (err: any) {
      setExcessError(err?.response?.data?.message || "Failed to remove incidental charge.");
    } finally {
      setIsDeletingCharge(false);
    }
  };

  // Distinct billing months
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    bills.forEach((b) => {
      const rawDate = b.due_date || b.date || b.created_at;
      if (rawDate) {
        const ym = String(rawDate).slice(0, 7);
        if (/^\d{4}-\d{2}$/.test(ym)) {
          monthsSet.add(ym);
        }
      }
    });
    return Array.from(monthsSet).sort().reverse();
  }, [bills]);

  const formatMonthLabel = (ym: string) => {
    try {
      const [year, month] = ym.split("-");
      const date = new Date(Number(year), Number(month) - 1, 1);
      return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    } catch {
      return ym;
    }
  };

  // Tab counts
  const tabCounts = useMemo(() => {
    const current = bills.filter((b) => b.status !== "voided").length;
    const history = bills.filter((b) => b.status === "paid" || b.status === "partially_paid").length;
    const unpaid = bills.filter(
      (b) => b.status === "unpaid" || b.status === "overdue" || b.status === "pending_verification"
    ).length;
    return { current, history, unpaid };
  }, [bills]);

  // Filtered bills
  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      // Tab filter
      if (activeTab === "current") {
        if (b.status === "voided") return false;
      } else if (activeTab === "history") {
        if (b.status !== "paid" && b.status !== "partially_paid") return false;
      } else if (activeTab === "unpaid") {
        if (b.status !== "unpaid" && b.status !== "overdue" && b.status !== "pending_verification") {
          return false;
        }
      }

      // Property filter
      if (selectedPropertyId) {
        const propName = (b.property_name || b.tenant?.property?.name || "").toLowerCase();
        const selectedProp = properties.find((p) => String(p.id) === String(selectedPropertyId));
        if (selectedProp && !propName.includes(selectedProp.name.toLowerCase())) {
          return false;
        }
      }

      // Tenant filter
      if (selectedTenantId && String(b.tenant_id) !== String(selectedTenantId)) {
        return false;
      }

      // Billing Month filter
      if (selectedMonth !== "all") {
        const rawDate = String(b.due_date || b.date || b.created_at || "");
        if (!rawDate.startsWith(selectedMonth)) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const tenantName = (b.tenant_name || b.tenant?.name || "").toLowerCase();
        const room = (b.room || b.tenant?.room || "").toLowerCase();
        const propName = (b.property_name || b.tenant?.property?.name || "").toLowerCase();
        const idStr = String(b.id);
        if (!tenantName.includes(q) && !room.includes(q) && !propName.includes(q) && !idStr.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [bills, activeTab, selectedPropertyId, selectedTenantId, selectedMonth, searchQuery, properties]);

  // Paginated bills
  const totalPages = Math.max(1, Math.ceil(filteredBills.length / pageSize));
  const paginatedBills = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredBills.slice(start, start + pageSize);
  }, [filteredBills, page, pageSize]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Billing"
        subtitle="View and manage tenant bills for rent, utilities, and incidental charges."
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              onClick={() => setIsExcessModalOpen(true)}
              className="gap-1.5"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Add Charge</span>
            </Button>
            <Button
              onClick={handleGenerateBills}
              loading={generating}
              className="gap-1.5 shadow-sm"
            >
              {!generating && <Zap className="h-4 w-4" />}
              <span>Generate Bills</span>
            </Button>
          </div>
        }
      />

      {message && <AlertBanner variant="success" message={message} />}
      {error && <AlertBanner variant="danger" message={error} onRetry={loadBills} />}

      {/* Main Billing Table Section */}
      <div className="space-y-4">
        {/* Navigation Tabs (Current Bills | Payment History | Unpaid) */}
        <div className="flex items-center gap-1 p-1 bg-inset border border-edge rounded-md w-fit">
          <button
            type="button"
            onClick={() => {
              setActiveTab("current");
              setPage(1);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[13px] font-medium transition-colors ${
              activeTab === "current"
                ? "bg-card text-fg shadow-soft border border-edge"
                : "text-muted hover:text-fg"
            }`}
          >
            <span>Current Bills</span>
            <span
              className={`px-1 py-0.5 rounded text-[10px] tabular-nums ${
                activeTab === "current"
                  ? "bg-accent-soft text-accent"
                  : "bg-card text-muted"
              }`}
            >
              {tabCounts.current}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("history");
              setPage(1);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[13px] font-medium transition-colors ${
              activeTab === "history"
                ? "bg-card text-fg shadow-soft border border-edge"
                : "text-muted hover:text-fg"
            }`}
          >
            <span>Payment History</span>
            <span
              className={`px-1 py-0.5 rounded text-[10px] tabular-nums ${
                activeTab === "history"
                  ? "bg-accent-soft text-accent"
                  : "bg-card text-muted"
              }`}
            >
              {tabCounts.history}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("unpaid");
              setPage(1);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[13px] font-medium transition-colors ${
              activeTab === "unpaid"
                ? "bg-card text-fg shadow-soft border border-edge"
                : "text-muted hover:text-fg"
            }`}
          >
            <span>Unpaid / Past Due</span>
            <span
              className={`px-1 py-0.5 rounded text-[10px] tabular-nums ${
                activeTab === "unpaid"
                  ? "bg-danger-soft text-danger-fg"
                  : "bg-card text-muted"
              }`}
            >
              {tabCounts.unpaid}
            </span>
          </button>
        </div>

        {/* Modular Filter Toolbar */}
        <BillingFilterBar
          properties={properties}
          visibleTenants={visibleTenants}
          availableMonths={availableMonths}
          selectedPropertyId={selectedPropertyId}
          selectedTenantId={selectedTenantId}
          selectedMonth={selectedMonth}
          searchQuery={searchQuery}
          loading={loading}
          onPropertyChange={handlePropertyChange}
          onTenantChange={(tId) => {
            setSelectedTenantId(tId);
            setPage(1);
          }}
          onMonthChange={(m) => {
            setSelectedMonth(m);
            setPage(1);
          }}
          onSearchChange={(q) => {
            setSearchQuery(q);
            setPage(1);
          }}
          onRefresh={loadBills}
          formatMonthLabel={formatMonthLabel}
        />

        {/* Modular Master Bills Table */}
        <BillingBillsTable
          bills={paginatedBills}
          totalRecords={filteredBills.length}
          loading={loading}
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
          onPageChange={setPage}
          onViewInvoice={setSelectedInvoice}
          onRecordPayment={setDirectPaymentInvoice}
          onVoidBill={setVoidingBill}
        />
      </div>

      {/* Modular Pending Unbilled Incidental Charges Section */}
      <PendingChargesTable
        charges={excessCharges}
        loading={loadingCharges}
        error={excessError}
        onOpenAddModal={() => setIsExcessModalOpen(true)}
        onDeleteCharge={setDeletingCharge}
        onRetry={loadExcessCharges}
      />

      {/* Invoice Detail Modal */}
      <InvoiceModal
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        onRecordPayment={(bill) => {
          setSelectedInvoice(null);
          setDirectPaymentInvoice(bill);
        }}
      />

      {/* Direct Payment Modal */}
      <DirectPaymentModal
        invoice={directPaymentInvoice}
        onClose={() => setDirectPaymentInvoice(null)}
        onSuccess={() => {
          loadBills();
        }}
      />

      {/* Excess Charge Modal */}
      <ExcessChargeModal
        open={isExcessModalOpen}
        onClose={() => setIsExcessModalOpen(false)}
        tenants={activeTenants}
        onSuccess={() => {
          loadExcessCharges();
        }}
      />

      {/* Confirm Void Bill Modal */}
      <ConfirmDialog
        open={!!voidingBill}
        title="Cancel Bill"
        description={
          voidingBill
            ? `Are you sure you want to cancel the bill for Room ${voidingBill.room || voidingBill.tenant?.room || "—"} (${formatCurrency(
                voidingBill.total_amount
              )})? Attached incidental charges will be released back to pending.`
            : ""
        }
        confirmText="Yes, Cancel Bill"
        variant="danger"
        loading={isVoidingBill}
        onConfirm={handleConfirmVoid}
        onClose={() => setVoidingBill(null)}
      />

      {/* Confirm Delete Excess Charge Modal */}
      <ConfirmDialog
        open={!!deletingCharge}
        title="Remove Incidental Charge"
        description={
          deletingCharge
            ? `Are you sure you want to delete "${deletingCharge.title}" (${formatCurrency(
                deletingCharge.amount
              )}) for ${deletingCharge.tenant_name || "Tenant"}? This action cannot be undone.`
            : ""
        }
        confirmText="Yes, Delete Charge"
        variant="danger"
        loading={isDeletingCharge}
        onConfirm={handleConfirmDeleteCharge}
        onClose={() => setDeletingCharge(null)}
      />
    </div>
  );
}
