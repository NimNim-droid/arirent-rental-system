import { formatCurrency } from "@/lib/formatters";

interface BillingStatsProps {
  unpaidTotal: number;
  unpaidCount: number;
}

export function BillingStats({ unpaidTotal, unpaidCount }: BillingStatsProps) {
  if (unpaidCount === 0) return null;

  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-warning-border bg-warning-bg px-4 py-3">
      <div>
        <p className="text-xs font-medium text-warning-fg">
          Outstanding balance
        </p>
        <p className="text-lg font-semibold text-fg tabular-nums">
          {formatCurrency(unpaidTotal)}
        </p>
      </div>
      <span className="text-xs text-warning-fg">
        {unpaidCount} unpaid invoice{unpaidCount !== 1 ? "s" : ""}
      </span>
    </div>
  );
}
