import { TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/formatters";
import type { MonthlyTrendItem } from "@/lib/services/reports";

interface CollectionTrendProps {
  trend: MonthlyTrendItem[];
  loading: boolean;
}

export function CollectionTrend({ trend, loading }: CollectionTrendProps) {
  return (
    <Card className="p-5 border-edge shadow-sm bg-card space-y-4">
      <div className="pb-2 border-b border-edge">
        <h3 className="text-sm font-bold text-fg flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-accent" />
          6-Month Cash Flow Trend
        </h3>
        <p className="text-xs text-muted mt-0.5">
          Billed vs collected for the last 6 months. The Month filter does not apply here; the
          Property filter does.
        </p>
      </div>

      {loading ? (
        <Skeleton className="h-28 w-full" />
      ) : trend.length === 0 ? (
        <p className="text-xs text-muted py-4 text-center">No trend history available.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {trend.map((m) => {
            const hasBilling = m.billed > 0;
            const monthRate = hasBilling ? Math.round((m.collected / m.billed) * 100) : 0;
            return (
              <div
                key={m.month}
                className="p-3 rounded-xl border border-edge bg-inset/40 space-y-2 text-center"
              >
                <p className="text-xs font-bold text-fg">{m.label}</p>
                <div>
                  <p className="text-xs font-bold text-success-fg font-mono">
                    {formatCurrency(m.collected)}
                  </p>
                  <p className="text-[10px] text-muted font-mono mt-0.5">
                    of {formatCurrency(m.billed)}
                  </p>
                </div>
                {hasBilling ? (
                  <Badge
                    variant={monthRate >= 90 ? "success" : monthRate >= 70 ? "warning" : "neutral"}
                    className="text-[10px] font-mono px-1.5 py-0.2 mx-auto"
                  >
                    {monthRate}% Rate
                  </Badge>
                ) : (
                  <span className="text-[10px] text-muted">No billing</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
