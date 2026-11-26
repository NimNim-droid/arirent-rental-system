import { Building2, DoorOpen, MapPin, ShieldCheck } from "lucide-react";
import type { PublicListingTotals } from "./listing-helpers";

interface PublicStatsStripProps {
  totals: PublicListingTotals;
  loading: boolean;
}

export function PublicStatsStrip({ totals, loading }: PublicStatsStripProps) {
  const items = [
    {
      icon: Building2,
      value: loading ? "—" : String(totals.totalBuildings),
      label: totals.totalBuildings === 1 ? "Managed Building" : "Managed Buildings",
    },
    {
      icon: DoorOpen,
      value: loading ? "—" : String(totals.totalVacant),
      label: totals.totalVacant === 1 ? "Vacant Unit Open" : "Vacant Units Open",
    },
    {
      icon: MapPin,
      value: loading ? "—" : String(totals.totalListedRooms),
      label: "Published Units",
    },
    {
      icon: ShieldCheck,
      value: "0%",
      label: "Broker Fees",
    },
  ];

  return (
    <section aria-label="AriRent leasing summary">
      <div className="rounded-2xl bg-[#1d4ed8] dark:bg-[#17284c] px-5 py-6 sm:px-8 sm:py-7 text-white shadow-card ring-1 ring-white/10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/14 text-white ring-1 ring-white/15">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-extrabold tracking-tight tabular-nums leading-none">
                    {item.value}
                  </p>
                  <p className="mt-1 text-xs font-medium text-blue-100/90 truncate">
                    {item.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
