import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/cn";

export interface KpiCardProps {
  title: string;
  value: number;
  growth: number;
  icon: LucideIcon;
  iconClassName?: string;
}

function formatGrowth(value: number): string {
  return Math.abs(value).toFixed(1).replace(/\.0$/, "");
}

export function KpiCard({ title, value, growth, icon: Icon }: KpiCardProps) {
  const positive = growth > 0;
  const negative = growth < 0;
  const GrowthIcon = negative ? TrendingDown : TrendingUp;
  const tone = positive
    ? "text-success-fg"
    : negative
      ? "text-danger-fg"
      : "text-muted";

  return (
    <Card className="p-4 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted">{title}</p>
          <p className="mt-1 text-xl font-semibold tracking-tight text-fg tabular-nums">
            {formatCurrency(value)}
          </p>
          <p className="mt-1.5 flex items-center gap-1.5 text-[11px]">
            {(positive || negative) && (
              <GrowthIcon className={cn("h-3 w-3 shrink-0", tone)} />
            )}
            <span className={cn("font-medium", tone)}>{formatGrowth(growth)}%</span>
            <span className="text-muted">vs. last year</span>
          </p>
        </div>
        {Icon && (
          <span aria-hidden="true" className="text-faint">
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
    </Card>
  );
}

