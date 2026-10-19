import { useState } from "react";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { SectionHeader } from "@/components/common/section-header";
import { Input } from "@/components/ui/input";
import { AlertBanner } from "@/components/ui/alert-banner";
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
        <AlertBanner
          variant="danger"
          message={error}
          onRetry={() => loadTenants(searchTerm || undefined)}
        />
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
        <AlertBanner
          variant="success"
          message={successMessage}
          onClose={() => setSuccessMessage("")}
        />
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