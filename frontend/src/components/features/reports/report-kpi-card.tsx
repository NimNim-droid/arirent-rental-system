import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ReportKpiCardProps {
  title: string;
  /** Plain-language explanation of how this number is calculated. */
  info: string;
  /** Small informational icon rendered muted next to the label. */
  icon: ReactNode;
  /** Kept for API compatibility with existing pages; no longer rendered. */
  iconClassName?: string;
  loading: boolean;
  children: ReactNode;
}

export function ReportKpiCard({
  title,
  info,
  icon,
  loading,
  children,
}: ReportKpiCardProps) {
  return (
    <Card className="p-4 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
          {icon && (
            <span aria-hidden="true" className="text-faint">
              {icon}
            </span>
          )}
          {title}
          <span
            title={info}
            aria-label={`How ${title} is calculated: ${info}`}
            tabIndex={0}
            className="cursor-help text-faint hover:text-muted print:hidden"
          >
            <Info className="h-3 w-3" />
          </span>
        </span>
      </div>
      {loading ? <Skeleton className="h-6 w-28" /> : <div>{children}</div>}
    </Card>
  );
}
