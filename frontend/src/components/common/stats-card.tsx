import type { CSSProperties, ReactNode } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

interface StatsCardProps {
  title: string;
  value: ReactNode;
  subtitle?: string;
  icon: ReactNode;
  variant?: "accent" | "success" | "warning" | "danger" | "neutral";
  trend?: {
    value: string;
    isPositive: boolean;
  };
  delay?: number;
  onClick?: () => void;
}

export function StatsCard({ title, value, subtitle, icon, variant = "accent", trend, delay = 0, onClick }: StatsCardProps) {
  const iconColors = {
    accent: "bg-accent-soft text-accent ring-accent-border",
    success: "bg-success-bg text-success-fg ring-success-border",
    warning: "bg-warning-bg text-warning-fg ring-warning-border",
    danger: "bg-danger-bg text-danger-fg ring-danger-border",
    neutral: "bg-neutral-bg text-neutral-fg ring-neutral-border",
  };

  return (
    <Card
      onClick={onClick}
      className={cn(
        "group relative flex flex-col p-5",
        onClick && "cursor-pointer hover:border-edge-strong"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            {title}
          </p>
          <div className="mt-1 text-2xl font-extrabold tracking-tight text-fg tabular-nums">
            {value}
          </div>
          {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
        </div>
        <div className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
          iconColors[variant]
        )}>
          {icon}
        </div>
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-2 border-t border-edge pt-3">
          <span
            className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold ${
              trend.isPositive
                ? "bg-success-bg text-success-fg"
                : "bg-danger-bg text-danger-fg"
            }`}
          >
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {trend.value}
          </span>
          <span className="text-[11px] text-muted">vs last month</span>
        </div>
      )}
    </Card>
  );
}