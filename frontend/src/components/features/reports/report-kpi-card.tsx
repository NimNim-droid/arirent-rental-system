import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";

interface ReportKpiCardProps {
  title: string;
  /** Plain-language explanation of how this number is calculated. */
  info: string;
  icon: ReactNode;
  iconClassName: string;
  loading: boolean;
  children: ReactNode;
}

export function ReportKpiCard({
  title,
  info,
  icon,
  iconClassName,
  loading,
  children,
}: ReportKpiCardProps) {
  return (
    <Card className="p-5 border-edge shadow-sm bg-card space-y-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-fg-soft uppercase tracking-wider">
          {title}
          <span
            title={info}
            aria-label={`How ${title} is calculated: ${info}`}
            tabIndex={0}
            className="cursor-help text-muted hover:text-fg print:hidden"
          >
            <Info className="h-3 w-3" />
          </span>
        </span>
        <div className={cn("p-2 rounded-xl", iconClassName)}>{icon}</div>
      </div>
      {loading ? <Skeleton className="h-8 w-32" /> : <div>{children}</div>}
    </Card>
  );
}
