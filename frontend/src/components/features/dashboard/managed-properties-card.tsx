import { Link } from "react-router";
import { Home, Banknote } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/common/section-header";
import { Skeleton, SkeletonRows } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/formatters";
import type { DashboardStats, Property } from "@/lib/types";

interface ManagedPropertiesCardProps {
  properties: Property[];
  propsLoading: boolean;
  stats: DashboardStats | null;
  statsLoading: boolean;
}

export function ManagedPropertiesCard({
  properties,
  propsLoading,
  stats,
  statsLoading,
}: ManagedPropertiesCardProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <Card className="p-6 lg:col-span-2">
        <SectionHeader
                  icon={<Home className="h-4 w-4" />}
          title="Occupancy by Property"
          subtitle="Unit utilization across registered buildings"
        />
        <div className="mt-5 space-y-4">
          {propsLoading ? (
            <SkeletonRows rows={3} />
          ) : properties.length === 0 ? (
            <p className="text-xs text-muted">
              No occupancy data for the selected property filter.
            </p>
          ) : (
            properties.map((property) => {
              const occupied = property.occupied_count ?? 0;
              const total = property.rooms_count ?? 0;
              const pct =
                total === 0 ? 0 : Math.round((occupied / total) * 100);
              return (
                <Link
                  key={property.id}
                  to="/admin/tenants"
                  className="group block rounded-xl px-3 py-2 -mx-3 transition-colors duration-150 hover:bg-hover/60"
                  aria-label={`View tenants at ${property.name}`}
                >
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-semibold text-fg-soft group-hover:text-fg">
                      {property.name}
                    </span>
                    <span className="text-xs font-semibold text-muted tabular-nums">
                      {occupied}/{total} units ({pct}%)
                    </span>
                  </div>
                  <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-inset">
                    <div
                      className="h-full rounded-full bg-accent transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </Card>

      <Link
        to="/admin/billing"
        className="block group"
        aria-label="View billing and collections"
      >
        <Card className="p-6 flex flex-col justify-between h-full hover:border-edge-strong">
          <div>
            <SectionHeader
              icon={<Banknote className="h-4 w-4" />}
              title="Revenue & Receivables"
              subtitle="Collections breakdown"
            />
            <div className="mt-4">
              <div className="text-xl font-semibold text-fg tabular-nums">
                {statsLoading ? (
                  <Skeleton className="h-6 w-32" />
                ) : (
                  formatCurrency(stats?.total_revenue ?? 0)
                )}
              </div>
              <p className="text-xs text-muted mt-0.5">
                Total collected this billing cycle
              </p>

              <div className="mt-4 space-y-2 border-t border-edge pt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Receipts to verify</span>
                  {statsLoading ? (
                    <Skeleton className="h-4 w-16" />
                  ) : (
                    <span className="font-medium text-warning-fg tabular-nums">
                      {stats?.pending_payments ?? 0} receipt(s)
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Portfolio occupancy</span>
                  {statsLoading ? (
                    <Skeleton className="h-4 w-12" />
                  ) : (
                    <span className="font-semibold text-fg-soft tabular-nums">
                      {stats?.occupancy_rate ?? 0}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    </div>
  );
}
