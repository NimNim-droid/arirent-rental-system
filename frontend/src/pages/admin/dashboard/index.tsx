import { AlertTriangle, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  useAdminDashboard,
  AdminAttentionBanner,
  AdminStatsGrid,
  ManagedPropertiesCard,
  RecentMaintenanceTable,
} from "@/components/features/dashboard";

export default function AdminDashboard() {
  const {
    selectedProperty,
    setSelectedProperty,
    stats,
    statsLoading,
    statsError,
    properties,
    propsLoading,
    visibleProperties,
    occupancyOverall,
    loadStats,
  } = useAdminDashboard();

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <PageHeader
        title="Admin Dashboard"
        subtitle="Overview of rental operations, occupancy, and pending tasks"
        action={
          <div className="w-full sm:w-56">
            <Select
              aria-label="Filter by property"
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
            >
              <option value="all">All Properties</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.city}
                </option>
              ))}
            </Select>
          </div>
        }
      />

      {statsError ? (
        <Card className="p-6 text-center space-y-3">
          <AlertTriangle className="mx-auto h-8 w-8 text-warning-fg" />
          <p className="text-sm font-semibold text-fg">{statsError}</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => loadStats(selectedProperty)}
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </Card>
      ) : (
        <>
          {/* 2. Attention Required Banner */}
          <AdminAttentionBanner stats={stats} loading={statsLoading} />

          {/* 3. Portfolio Overview Metrics */}
          <AdminStatsGrid
            stats={stats}
            statsLoading={statsLoading}
            propsLoading={propsLoading}
            properties={properties}
            occupancyOverall={occupancyOverall}
          />

          {/* 4. Occupancy by Property & Revenue Card */}
          <ManagedPropertiesCard
            properties={visibleProperties}
            propsLoading={propsLoading}
            stats={stats}
            statsLoading={statsLoading}
          />

          {/* 5. Recent Maintenance Queue */}
          <RecentMaintenanceTable
            tickets={stats?.recent_maintenance ?? []}
            loading={statsLoading}
          />
        </>
      )}
    </div>
  );
}