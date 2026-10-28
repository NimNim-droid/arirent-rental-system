import { useNavigate } from "react-router";
import { Banknote, Home, Users } from "lucide-react";
import { StatsCard } from "@/components/common/stats-card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/formatters";
import type { DashboardStats, Property } from "@/lib/types";

interface AdminStatsGridProps {
  stats: DashboardStats | null;
  statsLoading: boolean;
  propsLoading: boolean;
  properties: Property[];
  occupancyOverall: number;
}

export function AdminStatsGrid({
  stats,
  statsLoading,
  propsLoading,
  properties,
  occupancyOverall,
}: AdminStatsGridProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      <h2 className="text-xs font-medium text-muted">Portfolio Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatsCard
          title="Monthly Collections"
          value={
            statsLoading ? (
              <Skeleton className="h-6 w-28" />
            ) : (
              formatCurrency(stats?.total_revenue ?? 0)
            )
          }
          subtitle="Registered payments this period"
          icon={<Banknote className="h-4 w-4" />}
          onClick={() => navigate("/admin/billing")}
        />
        <StatsCard
          title="Occupancy Rate"
          value={
            statsLoading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              `${occupancyOverall}%`
            )
          }
          subtitle={
            statsLoading
              ? "Calculating unit occupancy..."
              : `${stats?.occupied_rooms ?? 0} of ${
                  stats?.total_rooms ?? 0
                } units occupied`
          }
          icon={<Home className="h-4 w-4" />}
          onClick={() => navigate("/admin/tenants")}
        />
        <StatsCard
          title="Available Units"
          value={
            statsLoading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              String(
                Math.max(
                  0,
                  (stats?.total_rooms ?? 0) - (stats?.occupied_rooms ?? 0)
                )
              )
            )
          }
          subtitle={
            propsLoading
              ? "Loading properties..."
              : `${properties.length} managed properties`
          }
          icon={<Users className="h-4 w-4" />}
          onClick={() => navigate("/admin/tenants")}
        />
      </div>
    </div>
  );
}
