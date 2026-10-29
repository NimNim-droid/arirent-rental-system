import { ChevronRight, Calendar, AlertCircle } from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { formatCurrency, formatDate, formatInvoiceNumber } from "@/lib/formatters";
import type { Bill } from "@/lib/types";

interface TenantBillCardProps {
  bill: Bill;
  onView: (bill: Bill) => void;
  onPay?: (bill: Bill) => void;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: BadgeProps["variant"] }
> = {
  unpaid: { label: "Pending", variant: "warning" },
  partially_paid: { label: "Partial", variant: "warning" },
  pending_verification: { label: "Verification", variant: "info" },
  paid: { label: "Paid", variant: "success" },
  overdue: { label: "Overdue", variant: "danger" },
  voided: { label: "Cancelled", variant: "neutral" },
};

function formatMonthYear(dateString?: string | null): string {
  if (!dateString) return "Billing";
  try {
    if (/^\d{4}-\d{2}/.test(dateString)) {
      const [year, month] = dateString.split("-").map(Number);
      const d = new Date(year, month - 1, 1);
      return d.toLocaleDateString("en-PH", { month: "short", year: "numeric" });
    }
    const d = new Date(dateString);
    return isNaN(d.getTime())
      ? dateString
      : d.toLocaleDateString("en-PH", { month: "short", year: "numeric" });
  } catch {
    return dateString;
  }
}

/**
 * Mobile-first Bill Card component matching the AriRent phone UI.
 * Used in the Tenant Billing page list for Unpaid and Paid sections.
 */
export function TenantBillCard({ bill, onView, onPay }: TenantBillCardProps) {
  const paid = bill.paid_amount ?? 0;
  const remaining =
    bill.remaining_balance ?? Math.max(0, bill.total_amount - paid);
  const isPaid = bill.status === "paid" || remaining <= 0;
  const isOverdue = bill.status === "overdue";
  const isPendingVerification = bill.status === "pending_verification";
  const canPay =
    (bill.status === "unpaid" || bill.status === "partially_paid" || isOverdue) &&
    remaining > 0;

  const statusMeta = STATUS_CONFIG[bill.status] ?? {
    label: bill.status,
    variant: "neutral" as const,
  };

  const invoiceNo = formatInvoiceNumber(bill.id, bill.date || bill.due_date);
  const monthYear = formatMonthYear(bill.date || bill.due_date);
  const propertyTitle = bill.property_name || "AriRent Residences";
  const roomTitle = bill.room ? `Room ${bill.room}` : "Unit";

  return (
    <div
      onClick={() => onView(bill)}
      className="group relative cursor-pointer rounded-2xl border border-edge bg-card p-4 shadow-card transition-all duration-150 hover:border-edge-strong hover:shadow-soft active:scale-[0.99]"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onView(bill);
        }
      }}
      aria-label={`View invoice ${invoiceNo} for ${monthYear}`}
    >
      {/* Top Header: Month Year + Invoice # on left, Status Badge on right */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="font-bold text-base text-fg tracking-tight">
            {monthYear}
          </span>
          <span className="font-mono text-xs font-semibold text-muted">
            #{invoiceNo}
          </span>
        </div>
        <Badge
          variant={statusMeta.variant}
          className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
        >
          {statusMeta.label}
        </Badge>
      </div>

      {/* Property & Room subtitle */}
      <p className="mt-1 text-xs text-muted truncate">
        {propertyTitle} | {roomTitle}
      </p>

      {/* Middle row: Posted / Paid Date on left, Amount & Chevron on right */}
      <div className="mt-3 flex items-end justify-between gap-3 border-t border-edge/60 pt-3">
        <div className="space-y-1 min-w-0">
          <p className="text-[11px] text-muted flex items-center gap-1">
            <Calendar className="h-3 w-3 shrink-0 text-faint" />
            <span>
              {isPaid
                ? `Paid on ${formatDate(bill.payment_date || bill.date)}`
                : `Posted on ${formatDate(bill.date)}`}
            </span>
          </p>

          <p
            className={`text-xs font-semibold flex items-center gap-1 ${
              isPaid
                ? "text-success-fg"
                : isOverdue
                ? "text-danger-fg"
                : isPendingVerification
                ? "text-info-fg"
                : "text-warning-fg"
            }`}
          >
            {isPaid ? (
              <span>Settled on time</span>
            ) : isPendingVerification ? (
              <span>Awaiting admin review</span>
            ) : isOverdue ? (
              <span>Overdue since {formatDate(bill.due_date)}</span>
            ) : (
              <span>Due on {formatDate(bill.due_date)}</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-right">
          <div>
            <p className="text-[10px] uppercase font-bold text-muted tracking-wider">
              {isPaid ? "Total Paid" : "Amount Due"}
            </p>
            <p className="text-lg font-black tracking-tight text-fg tabular-nums">
              {formatCurrency(isPaid ? bill.total_amount : remaining)}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-faint group-hover:text-accent transition-colors" />
        </div>
      </div>

      {/* Reject Notice if previous payment was rejected */}
      {bill.status === "unpaid" && bill.reject_reason && (
        <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-danger-bg px-2.5 py-1.5 text-[11px] font-semibold text-danger-fg">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span className="truncate">Payment rejected: {bill.reject_reason}</span>
        </div>
      )}

      {/* Quick Pay GCash Button for payable bills */}
      {canPay && onPay && (
        <div className="mt-3 pt-2.5 border-t border-dashed border-edge flex items-center justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPay(bill);
            }}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-accent px-3 py-1.5 text-xs font-semibold text-white shadow-soft hover:bg-accent-strong active:scale-95 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Pay GCash
          </button>
        </div>
      )}
    </div>
  );
}
