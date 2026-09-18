import { formatCurrency } from "@/lib/formatters";

interface BillingStatsProps {
  unpaidTotal: number;
  unpaidCount: number;
}

export function BillingStats({ unpaidTotal, unpaidCount }: BillingStatsProps) {
  if (unpaidCount === 0) return null;

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-warning-border bg-warning-bg px-5 py-4 animate-fade-in-up">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-warning-fg mb-0.5">
          Outstanding Balance
        </p>
        <p className="text-xl font-extrabold text-fg tabular-nums">
          {formatCurrency(unpaidTotal)}
        </p>
      </div>
      <span className="text-xs text-warning-fg font-semibold">
        {unpaidCount} unpaid invoice(s)
      </span>
    </div>
  );
}
