import { useState } from "react";
import { Search, AlertTriangle, RefreshCw, CheckCircle } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { SectionHeader } from "@/components/common/section-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  useTenants,
  TenantApprovalCard,
  TenantTable,
  TenantDetailModal,
} from "@/components/features/tenant";
import { CreateBillModal } from "@/components/features/billing";
import type { Tenant } from "@/lib/types";

export default function AdminTenants() {
  const [billingTenant, setBillingTenant] = useState<Tenant | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>("");

  const {
    pendingApplicants,
    residents,
    searchTerm,
    setSearchTerm,
    selectedTenant,
    setSelectedTenant,
    loading,
    isSearching,
    error,
    busyId,
    loadTenants,
    handleApprove,
    handleReject,
    handleVacate,
  } = useTenants();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tenant Management"
        subtitle="Approve new registrations, manage active leases, and monitor resident accounts"
      />

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-xs font-semibold text-danger-fg">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => loadTenants(searchTerm || undefined)}
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      )}

      {/* Pending Applications Queue */}
      {!loading && !error && pendingApplicants.length > 0 && (
        <div className="space-y-4">
          <SectionHeader
            title={`Pending Applications (${pendingApplicants.length})`}
            subtitle="New tenant room reservations awaiting screening and approval"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingApplicants.map((app) => (
              <TenantApprovalCard
                key={app.id}
                applicant={app}
                isBusy={busyId === app.id}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </div>
        </div>
      )}

      {successMessage && (
        <div
          className="flex animate-fade-in-up items-center justify-between rounded-xl border border-success-border bg-success-bg p-4 text-sm font-semibold text-success-fg"
          role="status"
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage("")}
            className="text-xs text-success-fg/75 hover:text-success-fg font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Active Residents Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-base font-bold tracking-tight text-fg">
            Active Residents ({residents.length})
          </h2>
          <Input
            icon={<Search className="h-4 w-4" />}
            placeholder="Search by name, room..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="sm:max-w-xs"
          />
        </div>

        <TenantTable
          residents={residents}
          loading={loading}
          isSearching={isSearching}
          onSelectTenant={setSelectedTenant}
          onCreateBill={(t) => setBillingTenant(t)}
        />
      </div>

      {/* Tenant Detail Modal */}
      <TenantDetailModal
        tenant={selectedTenant}
        isBusy={busyId === selectedTenant?.id}
        onVacate={handleVacate}
        onClose={() => setSelectedTenant(null)}
      />

      {/* Create Individual Bill Modal */}
      <CreateBillModal
        isOpen={Boolean(billingTenant)}
        onClose={() => setBillingTenant(null)}
        onSuccess={(msg) => {
          setSuccessMessage(msg);
          loadTenants(searchTerm || undefined);
        }}
        tenants={residents}
        initialTenantId={billingTenant?.id}
      />
    </div>
  );
}