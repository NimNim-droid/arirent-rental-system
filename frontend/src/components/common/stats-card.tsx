import type { CSSProperties, ReactNode } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

interface StatsCardProps {
  title: string;
  value: ReactNode;
  subtitle?: string;
  /** Optional small, muted icon. Kept for API compatibility with existing pages. */
  icon?: ReactNode;
  variant?: "accent" | "success" | "warning" | "danger" | "neutral";
  trend?: {
    value: string;
    isPositive: boolean;
  };
  delay?: number;
  onClick?: () => void;
  className?: string;
}

/**
 * Compact stat block used on every dashboard/list page.
 * Neutral chrome: label, large tabular number, optional small muted icon.
 */
export function StatsCard({ title, value, subtitle, icon, trend, onClick, className }: StatsCardProps) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "group relative flex flex-col p-4 gap-1",
        onClick && "cursor-pointer hover:border-edge-strong"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-muted">{title}</p>
        {icon && (
          <span aria-hidden="true" className="text-faint">
            {icon}
          </span>
        )}
      </div>
      <div className="text-xl font-semibold tracking-tight text-fg tabular-nums">{value}</div>
      {subtitle && <p className="text-[11px] text-muted">{subtitle}</p>}

      {trend && (
        <div className="mt-1 flex items-center gap-1.5 text-[11px]">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-medium",
              trend.isPositive ? "text-success-fg" : "text-danger-fg"
            )}
          >
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {trend.value}
          </span>
          <span className="text-muted">vs last month</span>
        </div>
      )}
    </Card>
  );
}
