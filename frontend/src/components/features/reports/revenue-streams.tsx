import { PieChart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/formatters";
import type { RevenueStreams as RevenueStreamsData } from "@/lib/services/reports";

interface StreamRow {
  key: keyof RevenueStreamsData;
  label: string;
  /** Tailwind background class used for the dot and the bar. */
  color: string;
}

const STREAM_ROWS: StreamRow[] = [
  { key: "rent", label: "Base Apartment Rent", color: "bg-accent" },
  { key: "electricity", label: "Electricity Sub-Meter (kWh)", color: "bg-amber-500" },
  { key: "water", label: "Water Charges (Flat Rate)", color: "bg-cyan-500" },
  { key: "excess_charges", label: "Incidental & Excess Charges", color: "bg-emerald-500" },
  { key: "late_fees", label: "Late Fees", color: "bg-rose-500" },
];

interface RevenueStreamsProps {
  streams?: RevenueStreamsData;
  loading: boolean;
}

export function RevenueStreams({ streams, loading }: RevenueStreamsProps) {
  return (
    <Card className="p-5 border-edge shadow-sm bg-card space-y-4">
      <div className="pb-2 border-b border-edge">
        <h3 className="text-sm font-bold text-fg flex items-center gap-2">
          <PieChart className="h-4 w-4 text-accent" />
          Revenue Streams Breakdown
        </h3>
        <p className="text-xs text-muted mt-0.5">
          What the billed amount is made of. Shares add up to 100% of Gross Billed.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3 pt-2">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </div>
      ) : (
        <div className="space-y-3.5 pt-1">
          {STREAM_ROWS.map(({ key, label, color }) => {
            const stream = streams?.[key];
            const percentage = stream?.percentage ?? 0;
            return (
              <div key={key} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-fg flex items-center gap-1.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                    {label}
                  </span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-fg">{formatCurrency(stream?.amount ?? 0)}</span>
                    <span className="text-muted text-[11px]">({percentage}%)</span>
                  </div>
                </div>
                <div className="w-full bg-inset rounded-full h-2 overflow-hidden">
                  <div
                    className={`${color} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
