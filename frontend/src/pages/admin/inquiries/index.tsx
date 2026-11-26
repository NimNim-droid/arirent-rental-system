import { CheckCircle2, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import {
  INQUIRY_STATUS_LABELS,
  InquiryFilterBar,
  InquiryList,
  ManageInquiryModal,
  useAdminInquiries,
} from "@/components/features/inquiries";

export default function AdminInquiriesPage() {
  const {
    inquiries,
    counts,
    properties,
    loading,
    error,
    successMsg,
    statusFilter,
    setStatusFilter,
    propertyFilter,
    setPropertyFilter,
    searchInput,
    setSearchInput,
    activeInquiry,
    setActiveInquiry,
    editStatus,
    setEditStatus,
    editScheduledAt,
    setEditScheduledAt,
    editNotes,
    setEditNotes,
    saving,
    loadInquiries,
    openManageModal,
    handleSaveInquiry,
    handleQuickStatus,
    handleDelete,
  } = useAdminInquiries(INQUIRY_STATUS_LABELS);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visit Inquiries"
        subtitle="Track prospective tenants who want to inspect a property before submitting an application"
        action={
          <Button variant="secondary" size="sm" onClick={loadInquiries}>
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        }
      />

      {successMsg && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-md border border-success-border bg-success-bg px-3.5 py-2.5 text-xs font-medium text-success-fg"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-danger-border bg-danger-bg px-3.5 py-2.5 text-xs font-medium text-danger-fg">
          {error}
        </div>
      )}

      <InquiryFilterBar
        counts={counts}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        propertyFilter={propertyFilter}
        onPropertyFilterChange={setPropertyFilter}
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        properties={properties}
      />

      <InquiryList
        inquiries={inquiries}
        loading={loading}
        onOpenManageModal={openManageModal}
        onQuickStatus={handleQuickStatus}
        onDelete={handleDelete}
      />

      <ManageInquiryModal
        inquiry={activeInquiry}
        status={editStatus}
        onStatusChange={setEditStatus}
        scheduledAt={editScheduledAt}
        onScheduledAtChange={setEditScheduledAt}
        notes={editNotes}
        onNotesChange={setEditNotes}
        saving={saving}
        onSubmit={handleSaveInquiry}
        onClose={() => setActiveInquiry(null)}
      />
    </div>
  );
}
