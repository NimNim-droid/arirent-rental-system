import { useMemo } from "react";
import { Clock, Calendar, Plus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Tenant } from "@/lib/types";

interface UpcomingDueBannerProps {
  tenants: Tenant[];
  onBillTenant: (tenant: Tenant) => void;
}

export function UpcomingDueBanner({ tenants, onBillTenant }: UpcomingDueBannerProps) {
  // Find active tenants whose anniversary day is coming up in the next 7 days
  const upcomingTenants = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    return tenants
      .filter((t) => t.status === "active")
      .map((t) => {
        const bDay = t.billing_day || 1;
        let daysUntil = bDay - currentDay;
        // If day already passed this month, compute days until next month's day
        if (daysUntil < 0) {
          daysUntil = daysInMonth - currentDay + bDay;
        }
        return { tenant: t, daysUntil, bDay };
      })
      .filter((item) => item.daysUntil <= 7)
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [tenants]);

  if (upcomingTenants.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-accent/20 bg-accent/5 p-4 space-y-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-accent" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-accent">
            Upcoming Rent Due This Week ({upcomingTenants.length})
          </h3>
        </div>
        <span className="text-[11px] text-muted">
          Tenants whose monthly rent cycle is due within the next 7 days
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {upcomingTenants.map(({ tenant, daysUntil, bDay }) => (
          <div
            key={tenant.id}
            className="flex items-center justify-between rounded-xl border border-edge bg-card p-3 shadow-2xs hover:border-accent/40 transition-colors"
          >
            <div className="space-y-0.5">
              <p className="font-bold text-fg text-xs">{tenant.name}</p>
              <p className="text-[11px] text-muted">
                Room {tenant.room} • {tenant.property_name}
              </p>
              <div className="flex items-center gap-1.5 pt-1 text-[11px]">
                <Calendar className="h-3 w-3 text-accent" />
                <span className="font-semibold text-accent">
                  {daysUntil === 0
                    ? "Due Today!"
                    : daysUntil === 1
                    ? "Due Tomorrow!"
                    : `Due in ${daysUntil} days (Day ${bDay})`}
                </span>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => onBillTenant(tenant)}
              className="text-xs shrink-0 hover:bg-accent hover:text-white"
            >
              <Plus className="h-3 w-3 mr-1" />
              Bill Now
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
