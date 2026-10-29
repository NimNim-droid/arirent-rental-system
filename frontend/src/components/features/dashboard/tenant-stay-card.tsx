import { useState } from "react";
import { Home, MapPin, Building2, BadgeCheck, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/formatters";
import { TenantUnitDetailModal } from "./tenant-unit-detail-modal";
import type { TenantDashboardData } from "@/lib/types";

interface TenantStayCardProps {
  unit: TenantDashboardData["unit"] | undefined;
  loading: boolean;
}

/**
 * Hero card on the tenant home screen: current property, room and lease state.
 * Tapping "Unit Details" opens the tenancy terms and unit modal.
 */
export function TenantStayCard({ unit, loading }: TenantStayCardProps) {
  const [modalOpen, setModalOpen] = useState(false);

  if (loading) {
    return <Skeleton className="h-[164px] w-full rounded-3xl" />;
  }

  const location = [unit?.address, unit?.city].filter(Boolean).join(" · ");

  return (
    <>
      <section
        aria-label="Your unit"
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#121c32] via-[#1a2846] to-[#0f182c] p-5 text-white shadow-card"
      >
        {/* Decorative building silhouette */}
        <Building2
          aria-hidden="true"
          className="pointer-events-none absolute -right-3 top-3 h-28 w-28 text-white/5"
          strokeWidth={1.25}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-accent/15 blur-2xl"
        />

        <div className="relative">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-white/75">
            <Home className="h-3.5 w-3.5 text-accent" />
            You are staying in
          </p>

          <div className="mt-3 flex items-start gap-2">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#C9A24B]" />
            <div className="min-w-0">
              <h2 className="text-lg font-bold leading-snug tracking-tight text-white">
                {unit ? (
                  <>
                    {unit.property_name}
                    <span className="mx-1.5 text-white/40">|</span>
                    Room {unit.room}
                  </>
                ) : (
                  "No unit assigned yet"
                )}
              </h2>
              {location && (
                <p className="mt-0.5 truncate text-xs text-white/70">{location}</p>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
            <p className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-white/85">
              <BadgeCheck className="h-4 w-4 shrink-0 text-success-fg" />
              <span className="truncate">
                {unit?.lease_end
                  ? `Lease until ${formatDate(unit.lease_end)}`
                  : unit
                  ? "Active Lease Contract"
                  : "Awaiting assignment"}
              </span>
            </p>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 cursor-pointer"
            >
              Unit Details <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Dedicated Unit & Tenancy Terms Modal */}
      <TenantUnitDetailModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        unit={unit}
      />
    </>
  );
}
