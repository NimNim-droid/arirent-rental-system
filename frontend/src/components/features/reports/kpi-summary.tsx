import { AlertOctagon, ArrowDownRight, ArrowUpRight, DollarSign, Layers, Percent } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters";
import type { FinancialKpis, PaymentStatusCounts } from "@/lib/services/reports";
import { ReportKpiCard } from "./report-kpi-card";

interface KpiSummaryProps {
  kpis?: FinancialKpis;
  counts?: PaymentStatusCounts;
  loading: boolean;
  /** Growth vs the previous month only makes sense when a single month is selected. */
  showGrowth: boolean;
}

export function KpiSummary({ kpis, counts, loading, showGrowth }: KpiSummaryProps) {
  const growth = kpis?.growth_rate ?? 0;
  // Invoices still owing money: not yet due + partially paid + past due
  const openInvoices =
    (counts?.unpaid ?? 0) + (counts?.partially_paid ?? 0) + (counts?.overdue ?? 0);
  const rate = Math.min(100, Math.max(0, kpis?.collection_rate ?? 0));

  const valueClass = "text-xl font-semibold text-fg tabular-nums";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <ReportKpiCard
        title="Total Collected"
        info="Payments approved on invoices in this period. Payments still awaiting verification are not included."
        icon={<DollarSign className="h-4 w-4" />}
        loading={loading}
      >
        <p className={valueClass}>
          {formatCurrency(kpis?.total_collected ?? 0)}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="success">
            {kpis?.collection_rate ?? 0}% rate
          </Badge>
          {showGrowth && growth !== 0 && (
            <span
              className={`inline-flex items-center text-xs font-semibold ${
                growth >= 0 ? "text-success-fg" : "text-danger-fg"
              }`}
            >
              {growth >= 0 ? (
                <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5 mr-0.5" />
              )}
              {Math.abs(growth)}% vs last mo
            </span>
          )}
        </div>
      </ReportKpiCard>

      <ReportKpiCard
        title="Outstanding Debt"
        info="Remaining balance on invoices in this period that are unpaid, partially paid or past due. Voided invoices are excluded."
        icon={<AlertOctagon className="h-4 w-4" />}
        loading={loading}
      >
        <p className={`${valueClass} text-danger-fg`}>
          {formatCurrency(kpis?.total_outstanding ?? 0)}
        </p>
        <div className="flex flex-wrap items-center gap-x-1.5 mt-1.5 text-xs text-muted">
          <span>
            {openInvoices} open invoice{openInvoices !== 1 ? "s" : ""}
          </span>
          {(kpis?.overdue_count ?? 0) > 0 && (
            <span className="font-semibold text-danger-fg">
              · {formatCurrency(kpis?.overdue_amount ?? 0)} past due
            </span>
          )}
        </div>
      </ReportKpiCard>

      <ReportKpiCard
        title="Gross Billed"
        info="Total of all non-voided invoices issued in this period: rent, utilities, late fees and excess charges."
        icon={<Layers className="h-4 w-4" />}
        loading={loading}
      >
        <p className={valueClass}>
          {formatCurrency(kpis?.total_billed ?? 0)}
        </p>
        <p className="text-xs text-muted mt-1.5">
          Across {counts?.total_bills ?? 0} invoice{counts?.total_bills !== 1 ? "s" : ""}
        </p>
      </ReportKpiCard>

      <ReportKpiCard
        title="Collection Efficiency"
        info="Total Collected divided by Gross Billed, as a percentage."
        icon={<Percent className="h-4 w-4" />}
        loading={loading}
      >
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-semibold text-fg tabular-nums">
            {kpis?.collection_rate ?? 0}%
          </span>
          <span className="text-xs text-muted">of billed amount</span>
        </div>
        <div className="w-full bg-hover rounded-full h-1.5 mt-1.5 overflow-hidden">
          <div
            className="bg-accent h-1.5 rounded-full transition-all duration-150"
            style={{ width: `${rate}%` }}
          />
        </div>
      </ReportKpiCard>
    </div>
  );
}
