import type { CSSProperties, ReactNode } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  delay?: number;
  onClick?: () => void;
}

export function StatsCard({ title, value, subtitle, icon, trend, delay = 0, onClick }: StatsCardProps) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "group relative flex flex-col p-5 animate-fade-in-up",
        onClick && "cursor-pointer"
      )}
      style={{ animationDelay: `${delay}ms` } as CSSProperties}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
            {title}
          </p>
          <p className="mt-1.5 text-2xl font-extrabold tracking-tight text-fg tabular-nums">
            {value}
          </p>
          {subtitle && <p className="mt-1 text-xs text-muted">{subtitle}</p>}
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent ring-1 ring-inset ring-accent-border transition-transform duration-300 ease-out group-hover:scale-105">
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