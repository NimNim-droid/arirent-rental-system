import { SearchX, AlertTriangle, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonCards } from "@/components/ui/skeleton";
import {
  useAdminMaintenance,
  TicketFilters,
  TicketCard,
  DispatchModal,
} from "@/components/features/maintenance";

export default function AdminMaintenance() {
  const {
    filteredTickets,
    filter,
    setFilter,
    showArchived,
    setShowArchived,
    activeTicket,
    setActiveTicket,
    techName,
    setTechName,
    adminNotes,
    setAdminNotes,
    loading,
    error,
    busyId,
    archivedCount,
    counts,
    loadTickets,
    handleDispatch,
    handleMarkResolved,
    handleArchive,
    openDispatch,
  } = useAdminMaintenance();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Maintenance Requests"
        subtitle="Manage repair tickets, assign technicians, and track resolution"
      />

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

      {/* Filter Tabs */}
      <TicketFilters
        currentFilter={filter}
        counts={counts}
        showArchived={showArchived}
        archivedCount={archivedCount}
        onFilterChange={setFilter}
        onToggleArchived={() => setShowArchived(!showArchived)}
      />

      {/* Tickets Grid */}
      {loading ? (
        <SkeletonCards cards={3} />
      ) : filteredTickets.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            icon={<SearchX className="h-6 w-6" />}
            title="No tickets here"
            description={`There are no ${filter.replace("_", " ")} maintenance tickets right now.`}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTickets.map((t) => (
            <TicketCard
              key={t.id}
              ticket={t}
              busyId={busyId}
              onDispatch={openDispatch}
              onResolve={handleMarkResolved}
              onArchive={handleArchive}
            />
          ))}
        </div>
      )}

      {/* Dispatch Modal */}
      <DispatchModal
        open={!!activeTicket}
        ticket={activeTicket}
        techName={techName}
        adminNotes={adminNotes}
        isBusy={busyId === activeTicket?.id}
        onTechNameChange={setTechName}
        onAdminNotesChange={setAdminNotes}
        onSubmit={handleDispatch}
        onClose={() => setActiveTicket(null)}
      />
    </div>
  );
}