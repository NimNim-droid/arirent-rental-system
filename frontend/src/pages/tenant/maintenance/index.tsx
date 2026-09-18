import { CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import {
  useTenantMaintenance,
  TicketForm,
  TenantTicketList,
  TicketDetailModal,
} from "@/components/features/maintenance";

export default function TenantMaintenance() {
  const {
    tickets,
    loading,
    error,
    notice,
    submitting,
    selectedTicket,
    setSelectedTicket,
    description,
    setDescription,
    issueType,
    setIssueType,
    priority,
    setPriority,
    loadTickets,
    handleSubmit,
  } = useTenantMaintenance();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Maintenance Requests"
        subtitle="Submit repair requests anytime — our team responds within 24 hours"
      />

      {notice && (
        <div className="flex items-center gap-2 rounded-xl border border-success-border bg-success-bg px-4 py-3 text-xs font-semibold text-success-fg">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {notice}
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-xs font-semibold text-danger-fg">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </span>
          <Button variant="ghost" size="sm" onClick={loadTickets}>
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* New Request Form */}
        <TicketForm
          issueType={issueType}
          priority={priority}
          description={description}
          submitting={submitting}
          onIssueTypeChange={setIssueType}
          onPriorityChange={setPriority}
          onDescriptionChange={setDescription}
          onSubmit={handleSubmit}
        />

        {/* My Request History */}
        <TenantTicketList
          tickets={tickets}
          loading={loading}
          onSelectTicket={setSelectedTicket}
        />
      </div>

      {/* Ticket Detail Modal */}
      <TicketDetailModal
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
      />
    </div>
  );
}