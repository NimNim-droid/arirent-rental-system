import { formatCurrency } from "@/lib/formatters";

interface BillStatementSummaryProps {
  rent: number;
  electricityAmount: number;
  parsedUsage: number;
  water: number;
  lateFee: number;
  totalAmount: number;
  dueDate: string;
}

export function BillStatementSummary({
  rent,
  electricityAmount,
  parsedUsage,
  water,
  lateFee,
  totalAmount,
  dueDate,
}: BillStatementSummaryProps) {
  return (
    <div className="space-y-2 rounded-xl border border-edge bg-inset/60 p-3">
      <div className="flex items-center justify-between border-b border-edge/60 pb-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
          Statement Summary
        </span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-faint">
          Live Preview
        </span>
      </div>

      <div className="space-y-1 text-xs">
        <div className="flex items-center justify-between text-muted">
          <span>Room Rent</span>
          <span className="font-semibold tabular-nums text-fg">{formatCurrency(rent)}</span>
        </div>
        <div className="flex items-center justify-between text-muted">
          <span>Electricity ({parsedUsage} kWh)</span>
          <span className="font-semibold tabular-nums text-fg">
            {formatCurrency(electricityAmount)}
          </span>
        </div>
        <div className="flex items-center justify-between text-muted">
          <span>Water Utility</span>
          <span className="font-semibold tabular-nums text-fg">{formatCurrency(water)}</span>
        </div>
        {lateFee > 0 && (
          <div className="flex items-center justify-between text-danger-fg">
            <span>Late Fee / Surcharge</span>
            <span className="font-semibold tabular-nums">+{formatCurrency(lateFee)}</span>
          </div>
        )}
      </div>

      <div className="mt-0.5 flex items-center justify-between border-t border-edge-strong/50 pt-2">
        <div>
          <span className="block text-xs font-bold text-fg">Total Bill Amount</span>
          <span className="text-[10px] text-muted">
            Payable on or before {dueDate || "due date"}
          </span>
        </div>
        <span className="text-lg sm:text-xl font-extrabold tabular-nums tracking-tight text-accent">
          {formatCurrency(totalAmount)}
        </span>
      </div>
    </div>
  );
}
