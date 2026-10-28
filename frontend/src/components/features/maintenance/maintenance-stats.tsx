import { CheckCircle, Clock, Users, Wrench } from "lucide-react";
import { StatsCard } from "@/components/common/stats-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { TicketStatusCounts } from "@/lib/types";

interface MaintenanceStatsProps {
  counts: TicketStatusCounts;
  total: number;
  loading?: boolean;
}

function percentOf(value: number, total: number): string {
  if (total <= 0) return "0% of total";
  return `${Math.round((value / total) * 100)}% of total`;
}

export function MaintenanceStats({ counts, total, loading = false }: MaintenanceStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[104px] w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard
        title="Total Tickets"
        value={total}
        subtitle="All time"
        icon={<Wrench className="h-4 w-4" />}
        variant="accent"
      />
      <StatsCard
        title="Pending"
        value={counts.pending}
        subtitle={percentOf(counts.pending, total)}
        icon={<Clock className="h-4 w-4" />}
        variant="warning"
      />
      <StatsCard
        title="In Progress"
        value={counts.in_progress}
        subtitle={percentOf(counts.in_progress, total)}
        icon={<Users className="h-4 w-4" />}
        variant="accent"
      />
      <StatsCard
        title="Resolved"
        value={counts.resolved}
        subtitle={percentOf(counts.resolved, total)}
        icon={<CheckCircle className="h-4 w-4" />}
        variant="success"
      />
    </div>
  );
}
