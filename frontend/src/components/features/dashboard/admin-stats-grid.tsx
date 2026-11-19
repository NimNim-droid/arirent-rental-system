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
  isFiltered?: boolean;
  occupancyOverall: number;
}

export function AdminStatsGrid({
  stats,
  statsLoading,
  propsLoading,
  properties,
  isFiltered = false,
  occupancyOverall,
}: AdminStatsGridProps) {
  const navigate = useNavigate();
  const availableUnits =
    stats?.vacant_rooms ??
    Math.max(0, (stats?.total_rooms ?? 0) - (stats?.occupied_rooms ?? 0));

  return (
    <div className="space-y-3">
      <h2 className="text-xs font-medium text-muted">Portfolio Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatsCard
          title="Total Collections"
          value={
            statsLoading ? (
              <Skeleton className="h-6 w-28" />
            ) : (
              formatCurrency(stats?.total_revenue ?? 0)
            )
          }
          subtitle="Confirmed & partial payments"
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
              String(availableUnits)
            )
          }
          subtitle={
            propsLoading
              ? "Loading properties..."
              : isFiltered && properties.length === 1
              ? properties[0].name
              : `${properties.length} managed ${properties.length === 1 ? "property" : "properties"}`
          }
          icon={<Users className="h-4 w-4" />}
          onClick={() => navigate("/admin/properties")}
        />
      </div>
    </div>
  );
}
