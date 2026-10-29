import { Link } from "react-router";
import { CalendarX2, CreditCard, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate, formatInvoiceNumber } from "@/lib/formatters";
import type { Bill } from "@/lib/types";

interface TenantOpenBillCardProps {
  bill: Bill | null;
  /** Fallback when bills could not be loaded but the account still has a balance. */
  outstandingBalance: number;
  loading: boolean;
  onPay: (bill: Bill) => void;
}

const STATUS_META: Record<string, { label: string; variant: BadgeProps["variant"] }> = {
  unpaid: { label: "Unpaid", variant: "warning" },
  partially_paid: { label: "Partially Paid", variant: "warning" },
  overdue: { label: "Overdue", variant: "danger" },
  pending_verification: { label: "Pending Approval", variant: "info" },
};

const cardClass = "rounded-3xl border border-edge bg-card p-4 shadow-card";

/**
 * Featured open invoice on the tenant home screen with a quick "Pay Now" action.
 */
export function TenantOpenBillCard({
  bill,
  outstandingBalance,
  loading,
  onPay,
}: TenantOpenBillCardProps) {
  if (loading) {
    return (
      <div className={cardClass}>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-36" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="mt-4 flex items-end justify-between border-t border-edge pt-3">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>
    );
  }

  // Nothing open: either all caught up, or bills couldn't be listed but a balance exists.
  if (!bill) {
    const hasBalance = outstandingBalance > 0;
    return (
      <div className={`${cardClass} flex items-center gap-3`}>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
            hasBalance ? "bg-warning-bg text-warning-fg" : "bg-success-bg text-success-fg"
          }`}
        >
          {hasBalance ? <Clock className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-fg">
            {hasBalance ? formatCurrency(outstandingBalance) : "You're all caught up"}
          </p>
          <p className="text-xs text-muted">
            {hasBalance ? "Outstanding balance on your account" : "No open bills right now."}
          </p>
        </div>
        <Link
          to="/tenant/billing"
          className="shrink-0 text-xs font-semibold text-accent hover:text-accent-strong"
        >
          {hasBalance ? "View Bills" : "History"}
        </Link>
      </div>
    );
  }

  const paid = bill.paid_amount ?? 0;
  const remaining = bill.remaining_balance ?? Math.max(0, bill.total_amount - paid);
  const canPay =
    (bill.status === "unpaid" || bill.status === "partially_paid" || bill.status === "overdue") &&
    remaining > 0;
  const meta = STATUS_META[bill.status] ?? { label: bill.status, variant: "neutral" as const };

  return (
    <div className={cardClass}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-[11px] font-medium uppercase tracking-wide text-muted">
            Invoice:{" "}
            <span className="font-mono font-bold normal-case text-fg">
              {formatInvoiceNumber(bill.id, bill.date)}
            </span>
          </p>
          <p className="text-xs text-muted">Billing for {formatDate(bill.date)}</p>
          <p
            className={`flex items-center gap-1 text-xs font-semibold ${
              bill.status === "overdue" ? "text-danger-fg" : "text-warning-fg"
            }`}
          >
            <CalendarX2 className="h-3.5 w-3.5 shrink-0" />
            Due date: {formatDate(bill.due_date)}
          </p>
        </div>
        <Badge variant={meta.variant} className="shrink-0 rounded-full px-2.5 text-[11px]">
          {meta.label}
        </Badge>
      </div>

      {bill.status === "unpaid" && bill.reject_reason && (
        <p className="mt-3 flex items-start gap-1.5 rounded-xl bg-danger-bg px-3 py-2 text-[11px] font-medium text-danger-fg">
          <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
          Previous payment rejected: {bill.reject_reason}
        </p>
      )}

      <div className="mt-4 flex items-end justify-between gap-3 border-t border-edge pt-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-muted">
            {bill.status === "pending_verification" ? "Balance (under review)" : "Amount Due"}
          </p>
          <p className="truncate text-2xl font-extrabold tracking-tight text-fg tabular-nums">
            {formatCurrency(remaining)}
          </p>
        </div>
        {canPay ? (
          <Button
            size="lg"
            onClick={() => onPay(bill)}
            className="h-10 shrink-0 rounded-xl px-4 active:scale-95"
          >
            <CreditCard className="h-4 w-4" /> Pay Now
          </Button>
        ) : (
          <span className="shrink-0 text-[11px] font-medium text-muted">Awaiting admin review</span>
        )}
      </div>
    </div>
  );
}
