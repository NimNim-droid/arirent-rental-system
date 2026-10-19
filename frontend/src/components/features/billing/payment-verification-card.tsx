import { CheckCircle, XCircle, FileImage } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
import type { Bill } from "@/lib/types";

interface PaymentVerificationCardProps {
  payment: Bill;
  isBusy: boolean;
  onApprove: (id: string) => void;
  onRequestReject: (payment: Bill) => void;
  onViewReceipt: (payment: Bill) => void;
}

export function PaymentVerificationCard({
  payment,
  isBusy,
  onApprove,
  onRequestReject,
  onViewReceipt,
}: PaymentVerificationCardProps) {
  return (
    <Card className="flex flex-col justify-between border-warning-border bg-warning-bg/20 p-5">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-bold text-fg">
              {payment.tenant_name} (Room {payment.room})
            </h3>
            <p className="mt-1 text-xl font-extrabold text-fg tabular-nums">
              {formatCurrency(payment.total_amount)}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {payment.gcash_ref && (
                <span className="rounded-lg border border-edge bg-card px-2.5 py-1 font-mono text-xs font-semibold text-fg-soft">
                  GCash Ref: {payment.gcash_ref}
                </span>
              )}
              {payment.receipt_url && (
                <button
                  type="button"
                  onClick={() => onViewReceipt(payment)}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-accent-border bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent transition-colors hover:bg-accent hover:text-white"
                >
                  <FileImage className="h-3.5 w-3.5" />
                  View Receipt
                </button>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <Badge variant="warning" dot>
              Needs Verification
            </Badge>
            <span className="text-[11px] text-muted">{payment.date}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-warning-border/40 pt-3">
        <Button
          size="sm"
          className="flex-1"
          loading={isBusy}
          onClick={() => onApprove(payment.id)}
        >
          {!isBusy && (
            <>
              <CheckCircle className="h-4 w-4" />
              Approve Payment
            </>
          )}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          loading={isBusy}
          onClick={() => onRequestReject(payment)}
          className="text-danger-fg hover:border-danger-border hover:bg-danger-bg hover:text-danger-fg"
        >
          {!isBusy && (
            <>
              <XCircle className="h-4 w-4" />
              Reject
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
