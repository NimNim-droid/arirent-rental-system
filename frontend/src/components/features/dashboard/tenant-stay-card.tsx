import { Building2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/formatters";
import type { TenantDashboardData } from "@/lib/types";

interface TenantStayCardProps {
  unit: TenantDashboardData["unit"] | undefined;
  loading: boolean;
}

/**
 * Hero card on the tenant home screen matching the AriRent redesign.
 * Shows assigned property, room with gold emphasis, location, and monthly rate.
 * Omits formal lease expiration countdowns to keep the scope clean and avoid confusion.
 */
export function TenantStayCard({ unit, loading }: TenantStayCardProps) {
  if (loading) {
    return <Skeleton className="h-[160px] w-full rounded-3xl" />;
  }

  const location = [unit?.address, unit?.city].filter(Boolean).join(", ");

  return (
    <section
      aria-label="Your unit"
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#152238] via-[#1B2C4A] to-[#101A2E] p-5 sm:p-6 text-white shadow-card ring-1 ring-white/10"
    >
      {/* Decorative building silhouette */}
      <Building2
        aria-hidden="true"
        className="pointer-events-none absolute -right-3 -bottom-3 h-36 w-36 text-white/[0.04]"
        strokeWidth={1.25}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-[#C9A24B]/12 blur-3xl"
      />

      <div className="relative z-10 space-y-4">
        {/* Top: Property Name & Status Badge */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-slate-300/90 tracking-wide truncate">
            {unit?.property_name || "AriRent Residences"}
          </p>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-200 border border-emerald-400/25">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
            Active Tenant
          </span>
        </div>

        {/* Center: Large Room Number with Warm Champagne Gold Accent & Location */}
        <div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            {unit?.room ? (
              <>
                Room <span className="text-[#DFB966]">{unit.room}</span>
              </>
            ) : (
              "Unit Pending"
            )}
          </h2>
          <p className="mt-1 text-xs text-slate-300/80 truncate">
            {location || "AriRent Managed Property"}
          </p>
        </div>

        {/* Bottom: Room Rate / Stay Info */}
        {unit?.rent ? (
          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-slate-300/80 font-medium">Monthly Room Rent</span>
            <span className="font-bold text-white tabular-nums tracking-tight text-[13px]">
              {formatCurrency(unit.rent)} <span className="text-slate-300/75 font-normal">/ mo</span>
            </span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
