import { Link } from "react-router";
import { Plus, Wrench, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
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

const TYPE_LABEL: Record<MaintenanceTicket["type"], string> = {
  plumbing: "Plumbing",
  electrical: "Electrical",
  appliances: "Appliances",
  general: "General",
};

function CountTile({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: "warning" | "success";
}) {
  return (
    <Link
      to="/tenant/maintenance"
      className="flex flex-col items-center justify-center gap-2 rounded-3xl border border-edge bg-card p-3 shadow-card transition-transform active:scale-95"
    >
      <span className="text-2xl font-extrabold text-fg tabular-nums">{value}</span>
      <span
        className={cn(
          "rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
          tone === "warning"
            ? "border-warning-border bg-warning-bg text-warning-fg"
            : "border-success-border bg-success-bg text-success-fg"
        )}
      >
        {label}
      </span>
    </Link>
  );
}

/**
 * Maintenance quick actions on the tenant home: report an issue and ticket counts.
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
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[104px] rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <Link
          to="/tenant/maintenance"
          className="group flex flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-accent-border bg-accent-soft/40 p-3 text-center transition-all hover:bg-accent-soft active:scale-95"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-card text-accent shadow-card transition-transform group-hover:scale-105">
            <Plus className="h-5 w-5" />
          </span>
          <span className="text-[11px] font-semibold leading-tight text-accent">Report Issue</span>
        </Link>
        <CountTile value={openCount} label="Open" tone="warning" />
        <CountTile value={resolvedCount} label="Resolved" tone="success" />
      </div>

      {latestTicket && (
        <Link
          to="/tenant/maintenance"
          className="flex items-center gap-3 rounded-3xl border border-edge bg-card p-3.5 shadow-card transition-colors hover:bg-hover active:scale-[0.99]"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-info-bg text-info-fg">
            <Wrench className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-fg">
              Latest request · {TYPE_LABEL[latestTicket.type] ?? latestTicket.type}
            </p>
            <p className="truncate text-[11px] text-muted">
              {STATUS_LABEL[latestTicket.status] ?? latestTicket.status} — {latestTicket.description}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-faint" />
        </Link>
      )}
    </div>
  );
}
