import type { ReactNode } from "react";
import { AlertOctagon, CheckCircle2, Clock, Layers } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/formatters";
import type { FinancialKpis, PaymentStatusCounts } from "@/lib/services/reports";

interface SettlementHealthProps {
  counts?: PaymentStatusCounts;
  kpis?: FinancialKpis;
  loading: boolean;
}

interface Tile {
  label: string;
  icon: ReactNode;
  value: number;
  caption: string;
  container: string;
  labelClass: string;
  valueClass?: string;
}

export function SettlementHealth({ counts, kpis, loading }: SettlementHealthProps) {
  const tiles: Tile[] = [
    {
      label: "Fully Paid",
      icon: <CheckCircle2 className="h-3 w-3" />,
      value: counts?.paid ?? 0,
      caption: "Settled in full",
      container: "bg-success-bg/40 border-success-border/60",
      labelClass: "text-success-fg",
    },
    {
      label: "Partial",
      icon: <Clock className="h-3 w-3" />,
      value: counts?.partially_paid ?? 0,
      caption: "Part-paid, not yet due",
      container: "bg-warning-bg/40 border-warning-border/60",
      labelClass: "text-warning-fg",
    },
    {
      label: "Unpaid",
      icon: <AlertOctagon className="h-3 w-3" />,
      value: counts?.unpaid ?? 0,
      caption: "Not yet due",
      container: "bg-inset border-edge",
      labelClass: "text-fg-soft",
    },
    {
      label: "Overdue",
      icon: <AlertOctagon className="h-3 w-3" />,
      value: counts?.overdue ?? 0,
      caption: `Past due · ${formatCurrency(kpis?.overdue_amount ?? 0)}`,
      container: "bg-danger-bg/60 border-danger-border",
      labelClass: "text-danger-fg",
      valueClass: "text-danger-fg",
    },
    {
      label: "In Review",
      icon: <Clock className="h-3 w-3" />,
      value: counts?.pending_verification ?? 0,
      caption: "Payment awaiting review",
      container: "bg-inset border-edge",
      labelClass: "text-accent",
    },
    {
      label: "Total Records",
      icon: <Layers className="h-3 w-3" />,
      value: counts?.total_bills ?? 0,
      caption: "Invoices in this view",
      container: "bg-inset border-edge",
      labelClass: "text-fg-soft",
    },
  ];

  return (
    <Card className="p-5 border-edge shadow-sm bg-card space-y-4">
      <div className="pb-2 border-b border-edge">
        <h3 className="text-sm font-bold text-fg flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-success-fg" />
          Invoice Settlement Health
        </h3>
        <p className="text-xs text-muted mt-0.5">
          Invoices by status. "Overdue" means unpaid or part-paid after the due date.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3 pt-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
          {tiles.map((tile) => (
            <div key={tile.label} className={`p-3 rounded-xl border space-y-1 ${tile.container}`}>
              <span className={`text-[11px] font-semibold flex items-center gap-1 ${tile.labelClass}`}>
                {tile.icon} {tile.label}
              </span>
              <p className={`text-xl font-bold font-mono ${tile.valueClass ?? "text-fg"}`}>
                {tile.value}
              </p>
              <p className="text-[10px] text-muted">{tile.caption}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
