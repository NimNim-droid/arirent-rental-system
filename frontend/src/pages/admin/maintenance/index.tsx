import { useState } from "react";
import { AlertTriangle, RefreshCw, SearchX } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonRows } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import {
  useAdminMaintenance,
  MaintenanceStats,
  TicketToolbar,
  TicketTable,
  TicketPagination,
  TicketDetailPanel,
} from "@/components/features/maintenance";

export default function AdminMaintenance() {
  const {
    tickets,
    meta,
    properties,
    search,
    statusFilter,
    propertyFilter,
    dateFrom,
    dateTo,
    page,
    pageSize,
    selectedId,
    selectedTicket,
    setSelectedId,
    loading,
    propertiesLoading,
    error,
    busyId,
    counts,
    totalTickets,
    handleSearchChange,
    handleStatusChange,
    handlePropertyChange,
    handleDateFromChange,
    handleDateToChange,
    handlePageChange,
    resetFilters,
    handleUpdateTicket,
    refresh,
  } = useAdminMaintenance();

  // Mobile: toggle between the ticket list and the detail panel.
  const [mobileDetail, setMobileDetail] = useState(false);

  const selectTicket = (ticket: { id: string }) => {
    setSelectedId(ticket.id);
    setMobileDetail(true);
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    statusFilter !== "all" ||
    propertyFilter !== "all" ||
    dateFrom !== "" ||
    dateTo !== "";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance Requests"
        subtitle="Manage and track all maintenance requests from tenants."
      />

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-md border border-danger-border bg-danger-bg px-4 py-2.5 text-xs text-danger-fg">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </span>
          <Button variant="ghost" size="sm" onClick={refresh}>
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      )}

      {/* Stat cards */}
      <MaintenanceStats
        counts={counts}
        total={totalTickets}
        loading={loading && !meta}
      />

      {/* Search + filter toolbar */}
      <TicketToolbar
        search={search}
        statusFilter={statusFilter}
        propertyFilter={propertyFilter}
        dateFrom={dateFrom}
        dateTo={dateTo}
        archivedCount={counts.archived}
        properties={properties}
        propertiesLoading={propertiesLoading}
        filtersActive={hasActiveFilters}
        resultCount={tickets.length}
        totalCount={meta?.total ?? 0}
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
        onPropertyChange={handlePropertyChange}
        onDateFromChange={handleDateFromChange}
        onDateToChange={handleDateToChange}
        onReset={resetFilters}
      />

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
        {/* Ticket list */}
        <div
          className={cn(
            "lg:col-span-2",
            mobileDetail && selectedTicket ? "hidden lg:block" : "block"
          )}
        >
          {loading ? (
            <Card className="p-4">
              <SkeletonRows rows={6} />
            </Card>
          ) : tickets.length === 0 ? (
            <Card className="p-0">
              <EmptyState
                icon={<SearchX className="h-6 w-6" />}
                title="No tickets found"
                description={
                  hasActiveFilters
                    ? "No maintenance tickets match your filters. Try resetting them."
                    : "There are no maintenance tickets yet."
                }
                action={
                  hasActiveFilters ? (
                    <Button variant="outline" size="sm" onClick={resetFilters}>
                      Reset filters
                    </Button>
                  ) : undefined
                }
              />
            </Card>
          ) : (
            <Card className="p-0 overflow-hidden">
              <TicketTable
                tickets={tickets}
                selectedId={selectedId}
                onSelect={selectTicket}
              />
              <TicketPagination
                currentPage={page}
                perPage={pageSize}
                total={meta?.total ?? 0}
                onPageChange={handlePageChange}
              />
            </Card>
          )}
        </div>

        {/* Ticket details */}
        <div className={cn(mobileDetail && selectedTicket ? "block" : "hidden", "lg:block")}>
          {selectedTicket ? (
            <TicketDetailPanel
              key={selectedTicket.id}
              ticket={selectedTicket}
              busy={busyId === selectedTicket.id}
              onBack={() => setMobileDetail(false)}
              onSave={(payload) => handleUpdateTicket(selectedTicket.id, payload)}
            />
          ) : (
            <Card className="p-0">
              <EmptyState
                icon={<SearchX className="h-6 w-6" />}
                title="No ticket selected"
                description="Select a ticket from the list to view its details."
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
