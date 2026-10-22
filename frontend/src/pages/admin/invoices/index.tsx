import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Search, RotateCw, AlertOctagon } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { AlertBanner } from "@/components/ui/alert-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  useBilling,
  PendingVerifications,
  InvoiceTable,
  InvoiceModal,
  DirectPaymentModal,
  CreateBillModal,
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

  // Filter toolbar (matching Figma slide: All Properties | All Tenants | All Statuses | Search)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [directPaymentInvoice, setDirectPaymentInvoice] = useState<Bill | null>(null);
  const [voidingBill, setVoidingBill] = useState<Bill | null>(null);
  const [isVoidingBill, setIsVoidingBill] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");

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

      // 3. Status filter
      if (selectedStatus !== "all" && b.status !== selectedStatus) {
        return false;
      }

      // 4. Search query
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
  }, [bills, selectedPropertyId, selectedTenantId, selectedStatus, search, properties]);

  const resetFilters = () => {
    setSelectedPropertyId("");
    setSelectedTenantId("");
    setSelectedStatus("all");
    setSearch("");
  };

  const handlePaymentSuccess = () => {
    loadBills();
    loadDelinquencies();
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
      {/* Page Header (Matching Figma slide) */}
      <PageHeader
        title="Invoice"
        subtitle="Create and manage invoices for tenants."
        action={
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Create Invoice</span>
          </Button>
        }
      />

      {(message || successMessage) && (
        <AlertBanner
          variant="success"
          message={successMessage || message}
        />
      )}
      {error && <AlertBanner variant="danger" message={error} onRetry={loadBills} />}

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

      {/* Pending GCash Verifications */}
      <PendingVerifications
        payments={pendingPayments}
        loading={loading}
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

      {/* Filter Toolbar (Matching Figma Slide: Properties | Tenants | Statuses | Search) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
        {/* All Properties */}
        <div>
          <Select
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            className="text-xs h-9"
          >
            <option value="">All Properties</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>

        {/* All Tenants */}
        <div>
          <Select
            value={selectedTenantId}
            onChange={(e) => setSelectedTenantId(e.target.value)}
            className="text-xs h-9"
          >
            <option value="">All Tenants</option>
            {activeTenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} (Room {t.room})
              </option>
            ))}
          </Select>
        </div>

        {/* All Statuses */}
        <div>
          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs h-9"
          >
            <option value="all">All Statuses</option>
            <option value="unpaid">Unpaid</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="paid">Paid</option>
            <option value="pending_verification">Pending Approval</option>
            <option value="voided">Cancelled</option>
          </Select>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
          <Input
            type="text"
            placeholder="Search invoice # or tenant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8.5 h-9 text-xs"
          />
        </div>

        {/* Reset Filters */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="h-9 text-xs text-muted hover:text-fg gap-1.5 w-full sm:w-auto"
          >
            <RotateCw className="h-3 w-3" />
            <span>Reset Filters</span>
          </Button>
        </div>
      </div>

      {/* Official Invoices Table (matching Figma slide layout) */}
      <InvoiceTable
        bills={filteredBills}
        loading={loading}
        busyId={busyId}
        onView={(bill) => setSelectedInvoice(bill)}
        onVoid={(id) => {
          const target = bills.find((b) => String(b.id) === String(id));
          if (target) setVoidingBill(target);
        }}
        onRecordPayment={(bill) => setDirectPaymentInvoice(bill)}
      />

      {/* Create Invoice Modal (Handles "+ Create Invoice" from slide) */}
      <CreateBillModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(msg) => {
          setIsCreateOpen(false);
          loadBills();
          setSuccessMessage(msg || "Invoice created successfully.");
          setTimeout(() => setSuccessMessage(""), 5000);
        }}
        tenants={activeTenants}
      />

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
    </div>
  );
}
