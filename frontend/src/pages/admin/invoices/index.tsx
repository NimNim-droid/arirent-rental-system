import { useState, useEffect, useCallback, useMemo } from "react";
import { RotateCw, AlertOctagon, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { SearchInput } from "@/components/common/search-input";
import { AlertBanner } from "@/components/ui/alert-banner";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  useBilling,
  PendingVerificationsBanner,
  PaymentReviewModal,
  InvoiceTable,
  InvoiceModal,
  DirectPaymentModal,
} from "@/components/features/billing";
import { billingService } from "@/lib/services/billing";
import { propertiesService } from "@/lib/services/properties";
import { tenantsService } from "@/lib/services/tenants";
import { formatCurrency, formatInvoiceNumber } from "@/lib/formatters";
import type { Bill, DelinquentTenant, Property, Tenant } from "@/lib/types";

export default function AdminInvoices() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [activeTenants, setActiveTenants] = useState<Tenant[]>([]);
  const [delinquents, setDelinquents] = useState<DelinquentTenant[]>([]);

  // Filter toolbar
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  // Pagination state (10 records per page to keep table clean and contained)
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  // Modals & Selection state
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);
  const [isConfirmBulkDeleteOpen, setIsConfirmBulkDeleteOpen] = useState<boolean>(false);
  const [deletingSingleBill, setDeletingSingleBill] = useState<Bill | null>(null);
  const [isDeletingSingle, setIsDeletingSingle] = useState<boolean>(false);

  const [isReviewQueueOpen, setIsReviewQueueOpen] = useState<boolean>(false);
  const [directPaymentInvoice, setDirectPaymentInvoice] = useState<Bill | null>(null);
  const [voidingBill, setVoidingBill] = useState<Bill | null>(null);
  const [isVoidingBill, setIsVoidingBill] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [localError, setLocalError] = useState<string>("");

  const {
    bills,
    pendingPayments,
    selectedInvoice,
    message,
    error,
    loading,
    busyId,
    setSelectedInvoice,
    loadBills,
    runVerify,
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

  const loadDelinquencies = useCallback(async () => {
    try {
      const res = await billingService.getDelinquencies();
      setDelinquents(res.data);
    } catch {
      // Delinquency check non-blocking
    }
  }, []);

  useEffect(() => {
    loadProperties();
    loadActiveTenants();
    loadDelinquencies();
  }, [loadProperties, loadActiveTenants, loadDelinquencies]);

  // Filter tenants list dynamically based on selected property (cascading filter)
  const visibleTenants = useMemo(() => {
    if (!selectedPropertyId) return activeTenants;
    return activeTenants.filter((t) => String(t.property_id) === String(selectedPropertyId));
  }, [activeTenants, selectedPropertyId]);

  const handlePropertyChange = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    setPage(1);

    // If currently selected tenant does not live in the selected property, reset tenant filter
    if (selectedTenantId && propertyId) {
      const isTenantInProp = activeTenants.some(
        (t) => String(t.id) === String(selectedTenantId) && String(t.property_id) === String(propertyId)
      );
      if (!isTenantInProp) {
        setSelectedTenantId("");
      }
    }
  };

  // Extract distinct billing months from existing invoices
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    bills.forEach((b) => {
      const rawDate = b.date || b.created_at || b.due_date;
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

  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      // 1. Property filter
      if (selectedPropertyId) {
        const propName = (b.property_name || b.tenant?.property?.name || "").toLowerCase();
        const selectedProp = properties.find((p) => String(p.id) === String(selectedPropertyId));
        if (selectedProp && !propName.includes(selectedProp.name.toLowerCase())) {
          return false;
        }
      }

      // 2. Tenant filter
      if (selectedTenantId && String(b.tenant_id) !== String(selectedTenantId)) {
        return false;
      }

      // 3. Billing Month/Year filter
      if (selectedMonth !== "all") {
        const rawDate = String(b.date || b.created_at || b.due_date || "");
        if (!rawDate.startsWith(selectedMonth)) {
          return false;
        }
      }

      // 4. Status filter
      if (selectedStatus !== "all" && b.status !== selectedStatus) {
        return false;
      }

      // 5. Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const tenantName = (b.tenant_name || b.tenant?.name || "").toLowerCase();
        const room = (b.room || b.tenant?.room || "").toLowerCase();
        const propName = (b.property_name || b.tenant?.property?.name || "").toLowerCase();
        const rawId = String(b.id);
        const formattedId = formatInvoiceNumber(b.id, b.created_at || b.due_date).toLowerCase();

        if (
          !tenantName.includes(q) &&
          !room.includes(q) &&
          !propName.includes(q) &&
          !rawId.includes(q) &&
          !formattedId.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [bills, selectedPropertyId, selectedTenantId, selectedMonth, selectedStatus, search, properties]);

  // Paginate filtered results (10 rows per page)
  const paginatedBills = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredBills.slice(start, start + pageSize);
  }, [filteredBills, page, pageSize]);

  const resetFilters = () => {
    setSelectedPropertyId("");
    setSelectedTenantId("");
    setSelectedMonth("all");
    setSelectedStatus("all");
    setSearch("");
    setPage(1);
  };

  const handlePaymentSuccess = () => {
    loadBills();
    loadDelinquencies();
  };

  const handleToggleSelect = (id: string) => {
    setSelectedInvoiceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    const visibleIds = paginatedBills.map((b) => String(b.id));
    const allVisibleSelected =
      visibleIds.length > 0 && visibleIds.every((id) => selectedInvoiceIds.includes(id));
    if (allVisibleSelected) {
      setSelectedInvoiceIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedInvoiceIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedInvoiceIds.length === 0) return;
    setIsBulkDeleting(true);
    setLocalError("");
    try {
      const res = await billingService.bulkDeleteBills(selectedInvoiceIds);
      setSuccessMessage(`Successfully deleted ${res.deleted} invoice(s).`);
      setSelectedInvoiceIds([]);
      setIsConfirmBulkDeleteOpen(false);
      await loadBills();
      await loadDelinquencies();
    } catch (err: any) {
      setLocalError(err?.response?.data?.message || "Failed to delete selected invoices.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleConfirmSingleDelete = async () => {
    if (!deletingSingleBill) return;
    setIsDeletingSingle(true);
    setLocalError("");
    try {
      await billingService.deleteBill(String(deletingSingleBill.id));
      const formattedNum = formatInvoiceNumber(
        deletingSingleBill.id,
        deletingSingleBill.created_at || deletingSingleBill.due_date
      );
      setSuccessMessage(`Invoice #${formattedNum} permanently deleted.`);
      setSelectedInvoiceIds((prev) => prev.filter((id) => id !== String(deletingSingleBill.id)));
      setDeletingSingleBill(null);
      await loadBills();
      await loadDelinquencies();
    } catch (err: any) {
      setLocalError(err?.response?.data?.message || "Failed to delete invoice.");
    } finally {
      setIsDeletingSingle(false);
    }
  };

  const handleConfirmVoid = async () => {
    if (!voidingBill) return;
    setIsVoidingBill(true);
    try {
      await handleVoid(voidingBill.id);
      setVoidingBill(null);
    } finally {
      setIsVoidingBill(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoice"
        subtitle="View and manage official tenant invoice records and payment history."
      />

      {(message || successMessage) && (
        <AlertBanner
          variant="success"
          message={successMessage || message}
        />
      )}
      {(error || localError) && (
        <AlertBanner variant="danger" message={localError || error} onRetry={loadBills} />
      )}

      {/* 2-Month Delinquency Critical Alert Banner */}
      {delinquents.length > 0 && (
        <div className="rounded-2xl border border-danger/30 bg-danger/10 p-4 sm:p-5 text-danger-fg animate-fade-in shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="rounded-xl bg-danger/20 p-2 text-danger-fg shrink-0 mt-0.5">
              <AlertOctagon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <h4 className="font-bold text-sm sm:text-base text-danger-fg">
                  Critical Attention: {delinquents.length} Tenant{delinquents.length > 1 ? "s" : ""} Overdue for 2+ Months
                </h4>
                <p className="text-xs text-danger-fg/90 mt-0.5">
                  Tenants with consecutive overdue invoices require delinquency policy follow-up or payment arrangements.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                {delinquents.map((d) => (
                  <div
                    key={d.tenant_id}
                    className="rounded-xl border border-danger/20 bg-card/60 p-3 space-y-1 text-fg backdrop-blur-sm"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-xs">{d.tenant_name}</p>
                        <p className="text-[11px] text-muted">Room {d.room} • {d.property_name}</p>
                      </div>
                      <Badge variant="danger" dot>
                        {d.overdue_count} Bills
                      </Badge>
                    </div>
                    <p className="text-xs font-bold text-danger-fg pt-1 tabular-nums">
                      Total Debt: {formatCurrency(d.total_overdue)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Payment Verifications Banner (Compact alert bar with Review Queue modal) */}
      <PendingVerificationsBanner
        payments={pendingPayments}
        onOpenReview={() => setIsReviewQueueOpen(true)}
      />

      {/* Payment Review Queue Modal */}
      <PaymentReviewModal
        open={isReviewQueueOpen}
        onClose={() => setIsReviewQueueOpen(false)}
        payments={pendingPayments}
        busyId={busyId}
        onApprove={async (id: string) => {
          await runVerify(id, true);
          loadDelinquencies();
        }}
        onReject={async (id: string, reason?: string) => {
          await runVerify(id, false, reason);
          loadDelinquencies();
        }}
      />

      {/* Unified Single-Line Filter Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 bg-card p-3 rounded-lg border border-edge">
        {/* Left: Prominent Search Box */}
        <div className="flex-1 min-w-[200px] max-w-full lg:max-w-xs">
          <SearchInput
            type="text"
            placeholder="Search invoice # or resident..."
            label="Search invoices"
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
          />
        </div>

        {/* Right: Inline Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Month / Year Filter */}
          <div className="w-[140px] sm:w-auto">
            <Select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setPage(1);
              }}
              className="text-xs h-9 min-w-[130px]"
            >
              <option value="all">All Months</option>
              {availableMonths.map((ym) => (
                <option key={ym} value={ym}>
                  {formatMonthLabel(ym)}
                </option>
              ))}
            </Select>
          </div>

          {/* Property Filter */}
          <div className="w-[130px] sm:w-auto">
            <Select
              value={selectedPropertyId}
              onChange={(e) => handlePropertyChange(e.target.value)}
              className="text-xs h-9 min-w-[125px]"
            >
              <option value="">All Properties</option>
              {properties.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Tenant Filter (Cascading based on selected property) */}
          <div className="w-[130px] sm:w-auto">
            <Select
              value={selectedTenantId}
              onChange={(e) => {
                setSelectedTenantId(e.target.value);
                setPage(1);
              }}
              disabled={visibleTenants.length === 0}
              className="text-xs h-9 min-w-[125px]"
            >
              <option value="">
                {visibleTenants.length === 0
                  ? "No Tenants in Property"
                  : selectedPropertyId
                  ? `All Residents (${visibleTenants.length})`
                  : "All Tenants"}
              </option>
              {visibleTenants.map((t) => (
                <option key={t.id} value={String(t.id)}>
                  {t.name} (Rm {t.room})
                </option>
              ))}
            </Select>
          </div>

          {/* Status Filter */}
          <div className="w-[125px] sm:w-auto">
            <Select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="text-xs h-9 min-w-[115px]"
            >
              <option value="all">All Statuses</option>
              <option value="unpaid">Unpaid</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="paid">Paid</option>
              <option value="pending_verification">Pending Approval</option>
              <option value="voided">Cancelled</option>
            </Select>
          </div>

          {/* Reset Filters Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="h-9 px-2.5 text-xs text-muted hover:text-fg gap-1"
            title="Reset all filters"
          >
            <RotateCw className="h-3 w-3" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
        </div>
      </div>

      {/* Official Invoices Table with Checkbox Selection and Contained Area Pagination */}
      <InvoiceTable
        bills={paginatedBills}
        totalBills={filteredBills.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        loading={loading}
        busyId={busyId}
        selectedIds={selectedInvoiceIds}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAll={handleToggleSelectAll}
        onView={(bill) => setSelectedInvoice(bill)}
        onVoid={(id) => {
          const target = bills.find((b) => String(b.id) === String(id));
          if (target) setVoidingBill(target);
        }}
        onDeleteSingle={(id) => {
          const target = bills.find((b) => String(b.id) === String(id));
          if (target) setDeletingSingleBill(target);
        }}
        onRecordPayment={(bill) => setDirectPaymentInvoice(bill)}
      />

      {/* Floating Bulk Action Bar */}
      {selectedInvoiceIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 sm:gap-4 bg-card/95 backdrop-blur-md border border-edge shadow-2xl rounded-2xl px-4 sm:px-5 py-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 text-accent text-xs font-bold font-mono">
              {selectedInvoiceIds.length}
            </span>
            <span className="text-sm font-medium text-fg whitespace-nowrap">
              {selectedInvoiceIds.length === 1 ? "1 invoice" : `${selectedInvoiceIds.length} invoices`} selected
            </span>
          </div>

          <div className="h-4 w-px bg-edge" />

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedInvoiceIds([])}
              className="h-8 text-xs text-muted hover:text-fg"
            >
              Deselect
            </Button>

            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsConfirmBulkDeleteOpen(true)}
              className="h-8 text-xs font-semibold gap-1.5 shadow-sm"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Selected ({selectedInvoiceIds.length})
            </Button>
          </div>
        </div>
      )}

      {/* Printable Invoice Statement Modal (matching popup in Figma slide) */}
      <InvoiceModal
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        onRecordPayment={(bill) => {
          setSelectedInvoice(null);
          setDirectPaymentInvoice(bill);
        }}
      />

      {/* Direct Offline Payment Recording Modal */}
      <DirectPaymentModal
        invoice={directPaymentInvoice}
        onClose={() => setDirectPaymentInvoice(null)}
        onSuccess={handlePaymentSuccess}
      />

      {/* Confirm Cancel Bill Modal */}
      <ConfirmDialog
        open={Boolean(voidingBill)}
        onClose={() => {
          if (!isVoidingBill) setVoidingBill(null);
        }}
        onConfirm={handleConfirmVoid}
        title="Cancel Monthly Bill"
        confirmText="Cancel Bill"
        cancelText="Keep Bill"
        variant="danger"
        loading={isVoidingBill}
        description={
          voidingBill ? (
            <span>
              Are you sure you want to cancel Invoice{" "}
              <strong className="text-fg font-semibold">
                #{formatInvoiceNumber(voidingBill.id, voidingBill.created_at || voidingBill.due_date)}
              </strong>{" "}
              ({formatCurrency(voidingBill.total_amount)}) for resident{" "}
              {voidingBill.tenant_name || voidingBill.tenant?.name || "Resident"}?
              <br />
              <span className="text-xs text-muted mt-1 block">
                This will void the invoice and remove the charge from the tenant's outstanding balance.
              </span>
            </span>
          ) : null
        }
      />

      {/* Confirm Bulk Delete Modal */}
      <ConfirmDialog
        open={isConfirmBulkDeleteOpen}
        onClose={() => {
          if (!isBulkDeleting) setIsConfirmBulkDeleteOpen(false);
        }}
        onConfirm={handleConfirmBulkDelete}
        title={`Delete ${selectedInvoiceIds.length} Selected Invoice${selectedInvoiceIds.length > 1 ? "s" : ""}`}
        confirmText={`Delete ${selectedInvoiceIds.length} Invoice${selectedInvoiceIds.length > 1 ? "s" : ""}`}
        cancelText="Keep Invoices"
        variant="danger"
        loading={isBulkDeleting}
        description={
          <div className="space-y-2">
            <p>
              Are you sure you want to permanently delete these{" "}
              <strong className="text-fg font-semibold">
                {selectedInvoiceIds.length}
              </strong>{" "}
              selected invoice{selectedInvoiceIds.length > 1 ? "s" : ""}?
            </p>
            <p className="text-xs text-muted">
              This action cannot be undone. Any utility readings or pending excess charges attached to these invoices will be freed so they can be billed again.
            </p>
          </div>
        }
      />

      {/* Confirm Single Delete Modal (for Cancelled Invoices) */}
      <ConfirmDialog
        open={Boolean(deletingSingleBill)}
        onClose={() => {
          if (!isDeletingSingle) setDeletingSingleBill(null);
        }}
        onConfirm={handleConfirmSingleDelete}
        title="Delete Cancelled Invoice"
        confirmText="Delete Invoice"
        cancelText="Cancel"
        variant="danger"
        loading={isDeletingSingle}
        description={
          deletingSingleBill ? (
            <span>
              Are you sure you want to permanently delete Invoice{" "}
              <strong className="text-fg font-semibold">
                #{formatInvoiceNumber(deletingSingleBill.id, deletingSingleBill.created_at || deletingSingleBill.due_date)}
              </strong>{" "}
              from the ledger?
              <br />
              <span className="text-xs text-muted mt-1 block">
                This will permanently remove the cancelled record. This action cannot be undone.
              </span>
            </span>
          ) : null
        }
      />
    </div>
  );
}
