import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export function StatsCard({ title, value, subtitle, icon, trend }: StatsCardProps) {
  return (
    <Card className="flex items-start justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</p>
        <p className="text-2xl font-black tracking-tight text-slate-900 mt-1.5">{value}</p>
        {subtitle && <p className="text-xs font-medium text-slate-400 mt-1">{subtitle}</p>}
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <span
              className={`text-xs font-bold ${
                trend.isPositive ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              {trend.value}
            </span>
            <span className="text-[11px] text-slate-400">vs last month</span>
          </div>
        )}
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
        {icon}
      </div>
    </Card>
  );
}
