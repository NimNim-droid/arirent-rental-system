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
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#121c32] via-[#1a2846] to-[#0f182c] p-5 sm:p-6 text-white shadow-card"
    >
      {/* Decorative building silhouette */}
      <Building2
        aria-hidden="true"
        className="pointer-events-none absolute -right-4 -bottom-3 h-36 w-36 text-white/5"
        strokeWidth={1.25}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-[#C8A04A]/15 blur-2xl"
      />

      <div className="relative z-10 space-y-4">
        {/* Top: Property Name & Status Badge */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-[#B9C5DD] tracking-wide truncate">
            {unit?.property_name || "AriRent Residences"}
          </p>
          <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 border border-emerald-500/30">
            Active Tenant
          </span>
        </div>

        {/* Center: Large Room Number with Gold Accent & Location */}
        <div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            {unit?.room ? (
              <>
                Room <span className="text-[#C8A04A]">{unit.room}</span>
              </>
            ) : (
              "Unit Pending"
            )}
          </h2>
          <p className="mt-0.5 text-xs text-[#B9C5DD] truncate">
            {location || "AriRent Managed Property"}
          </p>
        </div>

        {/* Bottom: Room Rate / Stay Info (No complex lease countdown) */}
        {unit?.rent ? (
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-[#D3DCEE]">
            <span className="text-[#B9C5DD]">Monthly Room Rent</span>
            <span className="font-bold text-white tabular-nums">
              {formatCurrency(unit.rent)} / mo
            </span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
