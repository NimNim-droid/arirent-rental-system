import { formatCurrency } from "@/lib/formatters";
import type { PublicListingTotals } from "./listing-helpers";

interface PublicStatsStripProps {
  totals: PublicListingTotals;
  loading: boolean;
  lowestRent?: number | null;
}

/**
 * Real availability numbers only: buildings, open rooms, and the lowest open rent.
 */
export function PublicStatsStrip({ totals, loading, lowestRent = null }: PublicStatsStripProps) {
  if (!loading && totals.totalBuildings === 0) return null;

  const items = [
    {
      value: loading ? "—" : String(totals.totalBuildings),
      label: totals.totalBuildings === 1 ? "Managed building" : "Managed buildings",
    },
    {
      value: loading ? "—" : String(totals.totalVacant),
      label: totals.totalVacant === 1 ? "Room open now" : "Rooms open now",
    },
    {
      value: loading || lowestRent == null ? "—" : formatCurrency(lowestRent),
      label: "Lowest monthly rent",
    },
  ];

  return (
    <section aria-label="Availability at a glance">
      <dl className="grid grid-cols-3 divide-x divide-edge rounded-2xl border border-edge bg-card shadow-card">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex flex-col-reverse gap-1 px-3 py-4 text-center sm:px-8 sm:py-6 sm:text-left"
          >
            <dt className="text-xs text-muted sm:text-sm">{item.label}</dt>
            <dd className="text-xl font-extrabold tracking-tight tabular-nums text-fg sm:text-3xl">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
