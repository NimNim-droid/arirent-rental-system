import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Zap,
  PlusCircle,
  Search,
  RotateCw,
  Building2,
  Users,
  Calendar,
  Wallet,
  Eye,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { SectionHeader } from "@/components/common/section-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { AlertBanner } from "@/components/ui/alert-banner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonRows } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  useBilling,
  InvoiceModal,
  ExcessChargeModal,
  DirectPaymentModal,
} from "@/components/features/billing";
import { tenantsService } from "@/lib/services/tenants";
import { excessChargesService } from "@/lib/services/excess-charges";
import { propertiesService } from "@/lib/services/properties";
import { formatCurrency, formatDate } from "@/lib/formatters";
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
  const [selectedDueDate, setSelectedDueDate] = useState<string>("");
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
      const charges = await excessChargesService.getCharges({ status: "pending" });
      setExcessCharges(charges);
    } catch {
      setExcessError("Failed to load pending incidental charges.");
    } finally {
      setLoadingCharges(false);
    }
  }, []);

  const refreshAll = useCallback(() => {
    loadBills();
    loadActiveTenants();
    loadExcessCharges();
    loadProperties();
  }, [loadBills, loadActiveTenants, loadExcessCharges, loadProperties]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const handleDeleteCharge = async (charge: ExcessCharge) => {
    setIsDeletingCharge(true);
    try {
      await excessChargesService.deleteCharge(charge.id);
      await loadExcessCharges();
      setDeletingCharge(null);
    } catch {
      setExcessError("Unable to remove charge. Please try again.");
    } finally {
      setIsDeletingCharge(false);
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

  const pendingChargesTotal = useMemo(() => {
    return excessCharges.reduce((sum, c) => sum + Number(c.amount), 0);
  }, [excessCharges]);

  // Tab counts
  const tabCounts = useMemo(() => {
    let current = 0;
    let history = 0;
    let unpaid = 0;

    bills.forEach((b) => {
      if (b.status !== "voided") {
        current++;
      }
      if (b.status === "paid" || b.status === "partially_paid") {
        history++;
      }
      if (b.status === "unpaid" || b.status === "overdue" || b.status === "pending_verification") {
        unpaid++;
      }
    });

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

      // Due Date filter
      if (selectedDueDate && b.due_date && !b.due_date.startsWith(selectedDueDate)) {
        return false;
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
  }, [bills, activeTab, selectedPropertyId, selectedTenantId, selectedDueDate, searchQuery, properties]);

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
        <div className="border-b border-edge flex items-center gap-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab("current");
              setPage(1);
            }}
            className={`pb-3 text-sm font-semibold transition-all relative ${
              activeTab === "current"
                ? "text-accent border-b-2 border-accent"
                : "text-muted hover:text-fg"
            }`}
          >
            Current Bills ({tabCounts.current})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("history");
              setPage(1);
            }}
            className={`pb-3 text-sm font-semibold transition-all relative ${
              activeTab === "history"
                ? "text-accent border-b-2 border-accent"
                : "text-muted hover:text-fg"
            }`}
          >
            Payment History ({tabCounts.history})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("unpaid");
              setPage(1);
            }}
            className={`pb-3 text-sm font-semibold transition-all relative ${
              activeTab === "unpaid"
                ? "text-accent border-b-2 border-accent"
                : "text-muted hover:text-fg"
            }`}
          >
            Unpaid ({tabCounts.unpaid})
          </button>
        </div>

        {/* Filter Bar (matching mockup) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
          {/* Property Dropdown */}
          <div>
            <Select
              value={selectedPropertyId}
              onChange={(e) => {
                setSelectedPropertyId(e.target.value);
                setPage(1);
              }}
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

          {/* Tenant Dropdown */}
          <div>
            <Select
              value={selectedTenantId}
              onChange={(e) => {
                setSelectedTenantId(e.target.value);
                setPage(1);
              }}
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

          {/* Due Date Filter */}
          <div className="relative">
            <Input
              type="date"
              value={selectedDueDate}
              onChange={(e) => {
                setSelectedDueDate(e.target.value);
                setPage(1);
              }}
              placeholder="Due Date"
              className="text-xs h-9"
            />
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
            <Input
              type="text"
              placeholder="Search tenant or unit..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-8 text-xs h-9"
            />
          </div>

          {/* Reset / Refresh */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedPropertyId("");
                setSelectedTenantId("");
                setSelectedDueDate("");
                setSearchQuery("");
                setPage(1);
                refreshAll();
              }}
              className="text-xs h-9 w-full flex items-center justify-center gap-1.5"
            >
              <RotateCw className="h-3.5 w-3.5" />
              <span>Reset Filters</span>
            </Button>
          </div>
        </div>

        {/* Master Bills Table */}
        <Card className="p-0 overflow-hidden">
          {loading ? (
            <div className="p-5">
              <SkeletonRows rows={5} />
            </div>
          ) : filteredBills.length === 0 ? (
            <EmptyState
              title="No bills found"
              description="No bills match your current filters. Click 'Generate Bills' to create the monthly billing cycle or 'Add Charge' for incidental items."
            />
          ) : (
            <div className="table-scroll-wrap">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Property / Unit</TableHead>
                    <TableHead className="text-right">Rent</TableHead>
                    <TableHead className="text-right">Utilities</TableHead>
                    <TableHead className="text-right">Other Charges</TableHead>
                    <TableHead className="text-right font-bold">Total Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedBills.map((bill) => {
                    const paid = bill.paid_amount ?? 0;
                    const remaining = bill.remaining_balance ?? Math.max(0, bill.total_amount - paid);
                    const isSettled = bill.status === "paid" || remaining <= 0;

                    const utilitiesSum = Number(bill.electricity || 0) + Number(bill.water || 0);
                    const otherChargesSum = (bill.excess_charges || []).reduce(
                      (sum, c) => sum + Number(c.amount || 0),
                      0
                    );

                    const tenantName = bill.tenant_name || bill.tenant?.name || "Resident";
                    const propName = bill.property_name || bill.tenant?.property?.name || "AriRent Property";
                    const roomName = bill.room || bill.tenant?.room || "—";

                    return (
                      <TableRow key={bill.id}>
                        {/* Tenant */}
                        <TableCell>
                          <p className="font-bold text-fg text-xs">{tenantName}</p>
                          <p className="text-[11px] text-muted">ID: #{bill.id}</p>
                        </TableCell>

                        {/* Property / Unit */}
                        <TableCell>
                          <p className="text-xs font-semibold text-fg">{propName}</p>
                          <p className="text-[11px] text-muted">Room {roomName}</p>
                        </TableCell>

                        {/* Rent */}
                        <TableCell className="text-right tabular-nums text-xs font-semibold text-fg whitespace-nowrap">
                          {formatCurrency(bill.rent)}
                        </TableCell>

                        {/* Utilities */}
                        <TableCell className="text-right tabular-nums whitespace-nowrap">
                          <p className="text-xs font-semibold text-fg">
                            {formatCurrency(utilitiesSum)}
                          </p>
                          <p className="text-[10px] text-muted">
                            ⚡ {formatCurrency(bill.electricity)} • 💧 {formatCurrency(bill.water)}
                          </p>
                        </TableCell>

                        {/* Other Charges */}
                        <TableCell className="text-right tabular-nums whitespace-nowrap">
                          <p className="text-xs font-semibold text-fg">
                            {formatCurrency(otherChargesSum)}
                          </p>
                          {bill.excess_charges && bill.excess_charges.length > 0 && (
                            <span className="inline-block rounded bg-accent/10 px-1.5 py-0.2 text-[10px] font-semibold text-accent">
                              {bill.excess_charges.length} item{bill.excess_charges.length !== 1 ? "s" : ""}
                            </span>
                          )}
                        </TableCell>

                        {/* Total Amount */}
                        <TableCell className="text-right tabular-nums whitespace-nowrap font-extrabold text-sm text-fg">
                          {formatCurrency(bill.total_amount)}
                        </TableCell>

                        {/* Due Date */}
                        <TableCell className="whitespace-nowrap text-xs text-muted">
                          {formatDate(bill.due_date)}
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Badge
                            dot
                            variant={
                              bill.status === "paid"
                                ? "success"
                                : bill.status === "partially_paid"
                                ? "warning"
                                : bill.status === "pending_verification"
                                ? "warning"
                                : bill.status === "voided"
                                ? "neutral"
                                : "danger"
                            }
                          >
                            {bill.status === "partially_paid"
                              ? "Partially Paid"
                              : bill.status === "pending_verification"
                              ? "Pending Approval"
                              : bill.status === "voided"
                              ? "Cancelled"
                              : bill.status}
                          </Badge>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedInvoice(bill)}
                              className="h-8 text-xs text-accent hover:text-accent-strong"
                              title="View Invoice Statement"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              View
                            </Button>

                            {!isSettled && bill.status !== "voided" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDirectPaymentInvoice(bill)}
                                className="h-8 text-xs font-medium"
                                title="Record Cash or Offline Payment Received"
                              >
                                <Wallet className="h-3.5 w-3.5 mr-1 text-accent" />
                                Record Cash
                              </Button>
                            )}

                            {bill.status !== "paid" && bill.status !== "voided" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setVoidingBill(bill)}
                                className="h-8 text-xs text-danger-fg hover:bg-danger/10 hover:text-danger-fg"
                                title="Cancel Bill"
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-1" />
                                Cancel
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Table Footer with Pagination Controls */}
          {filteredBills.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-edge text-xs text-muted">
              <div>
                Showing {(page - 1) * pageSize + 1} to{" "}
                {Math.min(page * pageSize, filteredBills.length)} of {filteredBills.length} records
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="h-7 px-2 text-xs"
                  >
                    Previous
                  </Button>
                  <span className="px-2 font-semibold text-fg">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="h-7 px-2 text-xs"
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Pending Unbilled Excess Charges Section (only shown when pending charges exist) */}
      {excessCharges.length > 0 && (
        <div className="space-y-4 pt-4">
          <SectionHeader
            title="Pending Unbilled Incidental Charges"
            subtitle="Extra charges (repairs, aircon cleaning, lost keys, extra appliances) that will be automatically attached when Generate Bills is executed"
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExcessModalOpen(true)}
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Add Charge
              </Button>
            }
          />

          {excessError && <AlertBanner variant="danger" message={excessError} onRetry={loadExcessCharges} />}

          <Card className="overflow-hidden p-0">
            {loadingCharges ? (
              <div className="p-5">
                <SkeletonRows rows={3} />
              </div>
            ) : (
              <div className="table-scroll-wrap">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Tenant & Room</TableHead>
                      <TableHead>Charge Title</TableHead>
                      <TableHead>Description / Notes</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {excessCharges.map((charge) => (
                      <TableRow key={charge.id}>
                        <TableCell className="whitespace-nowrap text-xs text-muted">
                          {formatDate(charge.charge_date)}
                        </TableCell>
                        <TableCell>
                          <p className="font-bold text-fg text-xs">{charge.tenant_name || "Tenant"}</p>
                          <p className="text-[11px] text-muted">Room {charge.room}</p>
                        </TableCell>
                        <TableCell className="font-semibold text-fg text-xs">
                          {charge.title}
                        </TableCell>
                        <TableCell className="text-xs text-muted max-w-xs truncate">
                          {charge.description || "—"}
                        </TableCell>
                        <TableCell className="text-right font-bold tabular-nums text-fg whitespace-nowrap">
                          {formatCurrency(charge.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge dot variant="warning">
                            Pending Next Bill
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingCharge(charge)}
                            className="text-danger-fg hover:bg-danger/10 h-7 px-2"
                            title="Remove Charge"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </div>
      )}


      {/* Invoice Detail Modal (with itemized added charges details) */}
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

      {/* Excess Charge Modal (Add Charge) */}
      <ExcessChargeModal
        open={isExcessModalOpen}
        onClose={() => setIsExcessModalOpen(false)}
        tenants={activeTenants}
        onSuccess={() => {
          loadExcessCharges();
        }}
      />

      {/* Confirm Remove Excess Charge Modal */}
      <ConfirmDialog
        open={Boolean(deletingCharge)}
        onClose={() => {
          if (!isDeletingCharge) setDeletingCharge(null);
        }}
        onConfirm={async () => {
          if (deletingCharge) {
            await handleDeleteCharge(deletingCharge);
          }
        }}
        title="Remove Pending Incidental Charge"
        confirmText="Remove Charge"
        cancelText="Cancel"
        variant="danger"
        loading={isDeletingCharge}
        description={
          deletingCharge ? (
            <span>
              Are you sure you want to remove the charge{" "}
              <strong className="text-fg font-semibold">"{deletingCharge.title}"</strong> ({formatCurrency(deletingCharge.amount)})
              for resident {deletingCharge.tenant_name || "Tenant"} (Room {deletingCharge.room})?
            </span>
          ) : null
        }
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
              Are you sure you want to cancel Invoice <strong className="text-fg font-semibold">#{voidingBill.id}</strong> ({formatCurrency(voidingBill.total_amount)}) for resident {voidingBill.tenant_name || voidingBill.tenant?.name || "Resident"}?
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