import { useState, useEffect, useCallback } from "react";
import { Plus, CheckCircle, AlertTriangle, RefreshCw, Receipt } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import {
  useBilling,
  PendingVerifications,
  InvoiceTable,
  InvoiceModal,
  CreateBillModal,
  UpcomingDueBanner,
} from "@/components/features/billing";
import { tenantsService } from "@/lib/services/tenants";
import type { Tenant } from "@/lib/types";

export default function AdminBilling() {
  const [activeTenants, setActiveTenants] = useState<Tenant[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedBillTenant, setSelectedBillTenant] = useState<Tenant | null>(null);

  const {
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
  } = useBilling();

  const loadActiveTenants = useCallback(async () => {
    try {
      const res = await tenantsService.getTenants({ status: "active", per_page: 100 });
      setActiveTenants(res.data);
    } catch {
      // Fallback silently if tenant list cannot be loaded
    }
  }, []);

  useEffect(() => {
    loadActiveTenants();
  }, [loadActiveTenants]);

  const handleOpenCreateModal = (tenant?: Tenant) => {
    setSelectedBillTenant(tenant || null);
    setIsCreateModalOpen(true);
  };

  const handleBillSuccess = () => {
    loadBills();
    loadActiveTenants();
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Billing & Invoices"
        subtitle="Issue individual tenant bills, batch generate invoices, and verify GCash payments"
        action={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              onClick={() => handleOpenCreateModal()}
            >
              <Receipt className="h-4 w-4" />
              Create Bill
            </Button>
            <Button onClick={handleGenerateBills} loading={generating}>
              {!generating && (
                <>
                  <Plus className="h-4 w-4" />
                  Generate Monthly Bills
                </>
              )}
            </Button>
          </div>
        }
      />

      {message && (
        <div
          className="flex animate-fade-in-up items-center gap-2 rounded-xl border border-success-border bg-success-bg p-4 text-sm font-semibold text-success-fg"
          role="status"
        >
          <CheckCircle className="h-5 w-5" />
          {message}
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-xs font-semibold text-danger-fg">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </span>
          <Button variant="ghost" size="sm" onClick={loadBills}>
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      )}

      {/* Upcoming Anniversary Due Dates Alert */}
      <UpcomingDueBanner
        tenants={activeTenants}
        onBillTenant={(t) => handleOpenCreateModal(t)}
      />

      {/* Pending GCash Verifications */}
      <PendingVerifications
        payments={pendingPayments}
        loading={loading}
        busyId={busyId}
        onApprove={(id) => runVerify(id, true)}
        onReject={(id, reason) => runVerify(id, false, reason)}
      />

      {/* All Invoices Table */}
      <InvoiceTable
        bills={bills}
        loading={loading}
        busyId={busyId}
        onView={setSelectedInvoice}
        onVoid={handleVoid}
      />

      {/* Invoice Detail / Printable Modal */}
      <InvoiceModal
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />

      {/* Create Individual Bill Modal */}
      <CreateBillModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSelectedBillTenant(null);
        }}
        onSuccess={handleBillSuccess}
        tenants={activeTenants}
        initialTenantId={selectedBillTenant?.id}
      />
    </div>
  );
}