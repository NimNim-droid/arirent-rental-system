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
    <div className="space-y-2 rounded-md border border-edge bg-inset p-3">
      <div className="flex items-center justify-between border-b border-edge/60 pb-1.5">
        <span className="text-xs font-medium text-fg-soft">
          Statement summary
        </span>
        <span className="text-[11px] text-faint">
          Live preview
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

      <div className="mt-0.5 flex items-center justify-between border-t border-edge pt-2">
        <div>
          <span className="block text-xs font-medium text-fg">Total bill amount</span>
          <span className="text-[10px] text-muted">
            Payable on or before {dueDate || "due date"}
          </span>
        </div>
        <span className="text-base font-semibold tabular-nums tracking-tight text-fg">
          {formatCurrency(totalAmount)}
        </span>
      </div>
    </div>
  );
}
