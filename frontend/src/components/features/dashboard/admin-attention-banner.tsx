import { Link } from "react-router";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardStats } from "@/lib/types";

interface AdminAttentionBannerProps {
  stats: DashboardStats | null;
  loading: boolean;
}

export function AdminAttentionBanner({ stats, loading }: AdminAttentionBannerProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="rounded-xl border border-edge bg-card p-4 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-36" />
          </div>
          <div className="rounded-xl border border-edge bg-card p-4 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const urgentTickets = stats.recent_maintenance.filter(
    (t) => t.status !== "resolved" && t.status !== "archived"
  );
  const hasAttention =
    stats.pending_applications > 0 ||
    stats.pending_payments > 0 ||
    urgentTickets.length > 0;

  if (hasAttention) {
    const totalAttention =
      (stats.pending_applications > 0 ? 1 : 0) +
      (stats.pending_payments > 0 ? 1 : 0) +
      (urgentTickets.length > 0 ? 1 : 0);

    return (
      <div className="space-y-3 animate-fade-in">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-medium text-muted">
            Attention Required
          </h2>
          <span className="text-xs font-semibold text-warning-fg">
            {totalAttention} operational item(s) need review
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {stats.pending_applications > 0 && (
            <div className="flex items-start justify-between gap-3 rounded-xl border border-warning-border bg-warning-bg/40 p-4 transition-colors hover:bg-warning-bg/60">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="warning" dot>
                    Pending Approval
                  </Badge>
                  <span className="font-mono text-xs font-bold text-fg tabular-nums">
                    {stats.pending_applications}
                  </span>
                </div>
                <h3 className="mt-2 text-sm font-bold text-fg">
                  Tenant Applications
                </h3>
                <p className="mt-0.5 text-xs text-muted">
                  Review incoming room reservation requests
                </p>
              </div>
              <Link to="/admin/tenants" className="shrink-0 pt-0.5">
                <Button
                  size="sm"
                  variant="secondary"
                  className="border-warning-border text-xs"
                >
                  Review &rarr;
                </Button>
              </Link>
            </div>
          )}
          {stats.pending_payments > 0 && (
            <div className="flex items-start justify-between gap-3 rounded-xl border border-warning-border bg-warning-bg/40 p-4 transition-colors hover:bg-warning-bg/60">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="warning" dot>
                    Needs Verification
                  </Badge>
                  <span className="font-mono text-xs font-bold text-fg tabular-nums">
                    {stats.pending_payments}
                  </span>
                </div>
                <h3 className="mt-2 text-sm font-bold text-fg">GCash Receipts</h3>
                <p className="mt-0.5 text-xs text-muted">
                  Verify tenant transaction reference numbers
                </p>
              </div>
              <Link to="/admin/billing" className="shrink-0 pt-0.5">
                <Button
                  size="sm"
                  variant="secondary"
                  className="border-warning-border text-xs"
                >
                  Verify &rarr;
                </Button>
              </Link>
            </div>
          )}
          {urgentTickets.length > 0 && (
            <div className="flex items-start justify-between gap-3 rounded-xl border border-danger-border bg-danger-bg/40 p-4 transition-colors hover:bg-danger-bg/60">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="danger" dot>
                    Needs Action
                  </Badge>
                  <span className="font-mono text-xs font-bold text-fg tabular-nums">
                    {urgentTickets.length}
                  </span>
                </div>
                <h3 className="mt-2 text-sm font-bold text-fg">
                  Maintenance Tickets
                </h3>
                <p className="mt-0.5 text-xs text-muted truncate">
                  {urgentTickets[0].room}: {urgentTickets[0].type}
                </p>
              </div>
              <Link to="/admin/maintenance" className="shrink-0 pt-0.5">
                <Button
                  size="sm"
                  variant="secondary"
                  className="border-danger-border text-danger-fg text-xs"
                >
                  Dispatch &rarr;
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-success-border/60 bg-success-bg/30 px-4 py-3 text-xs animate-fade-in">
      <span className="flex items-center gap-2 font-medium text-success-fg">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        All operations clear — no pending applications or unverified payments.
      </span>
      <span className="text-muted hidden sm:inline">
        Portfolio operational status normal
      </span>
    </div>
  );
}
