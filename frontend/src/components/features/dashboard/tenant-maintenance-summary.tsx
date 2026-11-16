import { Link } from "react-router";
import { Wrench, ChevronRight, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/formatters";
import type { MaintenanceTicket } from "@/lib/types";

interface TenantMaintenanceSummaryProps {
  openCount: number;
  resolvedCount: number;
  latestTicket: MaintenanceTicket | null;
  loading: boolean;
}

const STATUS_LABEL: Record<MaintenanceTicket["status"], string> = {
  pending: "Pending",
  in_progress: "In Progress",
  resolved: "Resolved",
  archived: "Archived",
};

/**
 * Maintenance summary card on tenant home matching the AriRent redesign:
 * - Top: Recent ticket status with chevron
 * - Bottom: 2 clean stat counters (Open vs Resolved)
 */
export function TenantMaintenanceSummary({
  openCount,
  resolvedCount,
  latestTicket,
  loading,
}: TenantMaintenanceSummaryProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
        </div>
      </div>
    );
  }

  const ticketDate = latestTicket?.created_at || latestTicket?.date;

  return (
    <div className="space-y-3">
      {/* Latest Ticket or All clear state */}
      <Link
        to="/tenant/maintenance"
        className="flex items-center gap-3.5 rounded-2xl border border-edge bg-card p-3.5 shadow-card transition-all hover:border-edge-strong hover:shadow-soft active:scale-[0.99] group"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-inset text-fg-soft border border-edge">
          {latestTicket ? (
            <Wrench className="h-5 w-5 text-accent" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-success-fg" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-fg">
            {latestTicket?.description || "All maintenance requests resolved"}
          </p>
          <p className="text-xs text-muted truncate">
            {latestTicket
              ? `${STATUS_LABEL[latestTicket.status] || latestTicket.status} · requested ${
                  ticketDate ? formatDate(ticketDate) : "recently"
                }`
              : "No issues reported in your unit."}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted group-hover:text-fg group-hover:translate-x-0.5 transition-all shrink-0" />
      </Link>

      {/* 2 Stat Counters: Open vs Resolved */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/tenant/maintenance"
          className="flex flex-col items-center justify-center rounded-2xl border border-edge bg-card p-3.5 shadow-card text-center transition-all hover:border-edge-strong active:scale-95"
        >
          <span className="text-2xl font-black text-fg tabular-nums">{openCount}</span>
          <span className="text-xs font-semibold text-muted">Open</span>
        </Link>

        <Link
          to="/tenant/maintenance"
          className="flex flex-col items-center justify-center rounded-2xl border border-edge bg-card p-3.5 shadow-card text-center transition-all hover:border-edge-strong active:scale-95"
        >
          <span className="text-2xl font-black text-fg tabular-nums">{resolvedCount}</span>
          <span className="text-xs font-semibold text-muted">Resolved</span>
        </Link>
      </div>
    </div>
  );
}
