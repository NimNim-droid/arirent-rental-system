import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";

interface MoveInTermsCardProps {
  rent: number;
  advanceMonths: number;
  depositMonths: number;
  moveInTotal: number;
}

export function MoveInTermsCard({
  rent,
  advanceMonths,
  depositMonths,
  moveInTotal,
}: MoveInTermsCardProps) {
  const advanceTotal = rent * advanceMonths;
  const depositTotal = rent * depositMonths;

  return (
    <Card className="p-5 sm:p-6 space-y-3.5">
      <div>
        <h2 className="text-sm font-semibold text-fg">Estimated Move-In Terms</h2>
        <p className="text-xs text-muted mt-0.5">
          Payable only after the landlord approves your application
        </p>
      </div>

      <div className="divide-y divide-edge rounded-lg border border-edge bg-inset text-xs">
        <div className="flex items-center justify-between px-3.5 py-2.5">
          <span className="text-fg-soft">Monthly Base Rent</span>
          <span className="font-medium text-fg tabular-nums">{formatCurrency(rent)}</span>
        </div>
        <div className="flex items-center justify-between px-3.5 py-2.5">
          <span className="text-fg-soft">
            Advance Rent ({advanceMonths} {advanceMonths === 1 ? "month" : "months"})
          </span>
          <span className="font-medium text-fg tabular-nums">{formatCurrency(advanceTotal)}</span>
        </div>
        <div className="flex items-center justify-between px-3.5 py-2.5">
          <span className="text-fg-soft">
            Security Deposit ({depositMonths} {depositMonths === 1 ? "month" : "months"})
          </span>
          <span className="font-medium text-fg tabular-nums">{formatCurrency(depositTotal)}</span>
        </div>
        <div className="flex items-center justify-between px-3.5 py-3 bg-card font-semibold text-fg">
          <span>Estimated Initial Move-In Total</span>
          <span className="text-sm tabular-nums">{formatCurrency(moveInTotal)}</span>
        </div>
      </div>

      <p className="text-[11px] text-muted leading-relaxed">
        Electricity and water charges are billed monthly based on actual sub-meter readings and
        building utility rates once your lease starts.
      </p>
    </Card>
  );
}
