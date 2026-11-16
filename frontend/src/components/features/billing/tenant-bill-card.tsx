import { ChevronRight, AlertCircle } from "lucide-react";
import { formatCurrency, formatDate, formatInvoiceNumber } from "@/lib/formatters";
import { cn } from "@/lib/cn";
import type { Bill } from "@/lib/types";

interface TenantBillCardProps {
  bill: Bill;
  onView: (bill: Bill) => void;
  onPay?: (bill: Bill) => void;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; tone: "warning" | "info" | "success" | "danger" | "neutral" }
> = {
  unpaid: { label: "Due", tone: "warning" },
  partially_paid: { label: "Partial", tone: "warning" },
  pending_verification: { label: "Review", tone: "info" },
  paid: { label: "On time", tone: "success" },
  overdue: { label: "Overdue", tone: "danger" },
  voided: { label: "Cancelled", tone: "neutral" },
};

function parseMonthAndYear(dateString?: string | null): { month: string; year: string } {
  if (!dateString) return { month: "Bill", year: "" };
  try {
    if (/^\d{4}-\d{2}/.test(dateString)) {
      const [year, monthNum] = dateString.split("-").map(Number);
      const d = new Date(year, monthNum - 1, 1);
      return {
        month: d.toLocaleDateString("en-PH", { month: "short" }),
        year: String(year),
      };
    }
    const d = new Date(dateString);
    if (!isNaN(d.getTime())) {
      return {
        month: d.toLocaleDateString("en-PH", { month: "short" }),
        year: String(d.getFullYear()),
      };
    }
  } catch {}
  return { month: "Bill", year: "" };
}

/**
 * Mobile-first Bill Card matching the AriRent redesign (Mockup 3).
 * Features:
 * - Left Month & Year box (e.g. Oct 2026)
 * - Center Invoice # and status timestamp
 * - Right Amount and status chip
 */
export function TenantBillCard({ bill, onView, onPay }: TenantBillCardProps) {
  const paid = bill.paid_amount ?? 0;
  const remaining =
    bill.remaining_balance ?? Math.max(0, bill.total_amount - paid);
  const isPaid = bill.status === "paid" || remaining <= 0;
  const isOverdue = bill.status === "overdue";
  const canPay =
    (bill.status === "unpaid" || bill.status === "partially_paid" || isOverdue) &&
    remaining > 0;

  const statusMeta = STATUS_CONFIG[bill.status] ?? {
    label: bill.status,
    tone: "neutral" as const,
  };

  const invoiceNo = formatInvoiceNumber(bill.id, bill.date || bill.due_date);
  const { month, year } = parseMonthAndYear(bill.date || bill.due_date);

  return (
    <div
      onClick={() => onView(bill)}
      className="group relative cursor-pointer rounded-2xl border border-edge bg-card p-3.5 sm:p-4 shadow-card transition-all duration-150 hover:border-edge-strong hover:shadow-soft active:scale-[0.99]"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onView(bill);
        }
      }}
      aria-label={`View bill #${invoiceNo} for ${month} ${year}`}
    >
      <div className="flex items-center gap-3.5">
        {/* Left: Month / Year Badge */}
        <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-inset border border-edge text-fg leading-none shadow-soft">
          <span className="text-xs uppercase font-extrabold tracking-tight">{month}</span>
          <span className="text-[10px] font-semibold text-muted mt-0.5">{year}</span>
        </div>

        {/* Center: Invoice ID & Subtitle */}
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sm text-fg tracking-tight truncate">
            #{invoiceNo}
          </p>
          <p className="text-xs text-muted truncate mt-0.5">
            {isPaid
              ? `Paid ${formatDate(bill.payment_date || bill.date)}`
              : `Due ${formatDate(bill.due_date)}`}
          </p>
        </div>

        {/* Right: Amount & Status Chip */}
        <div className="text-right shrink-0">
          <p className="text-sm sm:text-base font-extrabold text-fg tabular-nums tracking-tight">
            {formatCurrency(isPaid ? bill.total_amount : remaining)}
          </p>
          <span
            className={cn(
              "inline-block mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              statusMeta.tone === "success"
                ? "bg-success-bg text-success-fg"
                : statusMeta.tone === "danger"
                ? "bg-danger-bg text-danger-fg"
                : statusMeta.tone === "info"
                ? "bg-info-bg text-info-fg"
                : "bg-warning-bg text-warning-fg"
            )}
          >
            {statusMeta.label}
          </span>
        </div>

        <ChevronRight className="h-4 w-4 text-muted group-hover:text-fg group-hover:translate-x-0.5 transition-all shrink-0 hidden sm:block" />
      </div>

      {/* Reject Notice if payment was rejected */}
      {bill.status === "unpaid" && bill.reject_reason && (
        <div className="mt-2.5 flex items-start gap-1.5 rounded-lg bg-danger-bg px-2.5 py-1.5 text-[11px] font-semibold text-danger-fg">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span className="truncate">Payment rejected: {bill.reject_reason}</span>
        </div>
      )}

      {/* Quick Pay GCash Button for payable bills */}
      {canPay && onPay && (
        <div className="mt-3 pt-2.5 border-t border-dashed border-edge flex items-center justify-between">
          <span className="text-[11px] text-muted font-medium">Settle outstanding balance</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPay(bill);
            }}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-accent px-3 py-1.5 text-xs font-semibold text-white shadow-soft hover:bg-accent-strong active:scale-95 transition-all cursor-pointer"
          >
            Pay GCash
          </button>
        </div>
      )}
    </div>
  );
}
