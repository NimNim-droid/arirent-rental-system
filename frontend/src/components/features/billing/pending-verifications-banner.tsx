import { ShieldAlert, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
import type { Bill } from "@/lib/types";

interface PendingVerificationsBannerProps {
  payments: Bill[];
  onOpenReview: () => void;
}

/**
 * PendingVerificationsBanner
 * Displays a sleek, non-intrusive alert notification bar when payments are pending verification.
 * Keeps the Invoices table immediately visible regardless of how many payments are pending.
 */
export function PendingVerificationsBanner({
  payments,
  onOpenReview,
}: PendingVerificationsBannerProps) {
  if (!payments || payments.length === 0) return null;

  const totalAmount = payments.reduce((sum, p) => sum + Number(p.total_amount || 0), 0);
  const count = payments.length;

  return (
    <div className="rounded-2xl border border-warning-border bg-warning-bg/30 p-4 sm:p-4.5 text-warning-fg animate-fade-in shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
      <div className="flex items-start sm:items-center gap-3">
        <div className="rounded-xl bg-warning-bg p-2 text-warning-fg shrink-0 mt-0.5 sm:mt-0 border border-warning-border">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-sm sm:text-base text-fg">
              Payment Verifications Awaiting Review
            </h4>
            <span className="rounded-full bg-warning-bg border border-warning-border px-2 py-0.5 text-xs font-black text-warning-fg">
              {count}
            </span>
          </div>
          <p className="text-xs text-muted mt-0.5">
            {count} payment submission{count > 1 ? "s" : ""} pending confirmation • Total to reconcile:{" "}
            <strong className="text-fg font-semibold tabular-nums">
              {formatCurrency(totalAmount)}
            </strong>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          onClick={onOpenReview}
          size="sm"
          className="gap-1.5 shadow-sm font-semibold w-full sm:w-auto"
        >
          <span>Review Payments ({count})</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
