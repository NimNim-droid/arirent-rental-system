import { QrCode, Printer, Zap } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, formatDate, formatInvoiceNumber } from "@/lib/formatters";
import { printReceiptElement } from "@/lib/print";
import { ReceiptCard } from "./receipt-card";
import type { Bill } from "@/lib/types";

export interface TenantStatementModalProps {
  open?: boolean;
  invoice: Bill | null;
  onClose: () => void;
  onPayGCash?: (invoice: Bill) => void;
}

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
    return dateString || "Billing";
  }
}

/**
 * Mobile-first Bill Details Sheet matching the AriRent redesign (Image 2).
 * Clean, lightweight typography with itemized rent, water, and electricity,
 * and a direct "Download receipt" or "Pay via GCash" action.
 */
export function TenantStatementModal({
  open,
  invoice,
  onClose,
  onPayGCash,
}: TenantStatementModalProps) {
  const isOpen = open !== undefined ? open && !!invoice : !!invoice;
  if (!isOpen || !invoice) return null;

  const paid = invoice.paid_amount ?? 0;
  const remaining = invoice.remaining_balance ?? Math.max(0, invoice.total_amount - paid);
  const isSettled = invoice.status === "paid" || remaining <= 0;
  const isOverdue = invoice.status === "overdue";
  const canPay =
    (invoice.status === "unpaid" || invoice.status === "partially_paid" || isOverdue) &&
    remaining > 0;

  const invoiceNo = formatInvoiceNumber(invoice.id, invoice.date || invoice.due_date);
  const monthYear = formatMonthYear(invoice.date || invoice.due_date);
  const roomTitle = invoice.room ? `Room ${invoice.room}` : "Unit";

  const handlePrint = () => {
    printReceiptElement("printable-receipt");
  };

  const excessCharges = invoice.excess_charges || [];

  // Read-only meter proof recorded by the landlord for this invoice.
  const meterReading = (invoice.readings ?? []).find((r) => r.type !== "water") ?? null;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      hideHeader
      maxWidth="sm"
    >
      <div className="space-y-4 pt-1 pb-1">
        {/* Header: Month Year & Bill # · Room */}
        <div className="space-y-0.5">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-fg">
            {monthYear}
          </h2>
          <p className="text-xs text-muted font-medium">
            {invoiceNo} · {roomTitle}
          </p>
        </div>

        {/* Clean Line Items */}
        <div className="divide-y divide-edge/60 border-t border-b border-edge/60 py-1 text-[13px] sm:text-sm">
          <div className="flex items-center justify-between py-2.5">
            <span className="text-muted font-medium">Monthly rent</span>
            <span className="font-semibold text-fg tabular-nums">
              {formatCurrency(invoice.rent)}
            </span>
          </div>

          <div className="flex items-center justify-between py-2.5">
            <span className="text-muted font-medium">Water</span>
            <span className="font-semibold text-fg tabular-nums">
              {formatCurrency(invoice.water)}
            </span>
          </div>

          <div className="flex items-center justify-between py-2.5">
            <span className="text-muted font-medium">Electricity</span>
            <span className="font-semibold text-fg tabular-nums">
              {formatCurrency(invoice.electricity)}
            </span>
          </div>

          {/* Incidental / Add-on charges if present */}
          {excessCharges.map((charge) => (
            <div key={charge.id} className="flex items-center justify-between py-2.5">
              <span className="text-muted font-medium truncate max-w-[65%]">
                {charge.title}
              </span>
              <span className="font-semibold text-fg tabular-nums">
                {formatCurrency(charge.amount)}
              </span>
            </div>
          ))}

          {/* Late fee if present */}
          {invoice.late_fee > 0 && (
            <div className="flex items-center justify-between py-2.5 text-danger-fg">
              <span className="font-medium">Late surcharge</span>
              <span className="font-bold tabular-nums">
                {formatCurrency(invoice.late_fee)}
              </span>
            </div>
          )}

          {/* Total Row */}
          <div className="flex items-center justify-between pt-3 pb-1 text-sm sm:text-base font-extrabold">
            <span className="text-fg">{isSettled ? "Total paid" : "Total due"}</span>
            <span className="text-fg tabular-nums">
              {formatCurrency(isSettled ? invoice.total_amount : remaining)}
            </span>
          </div>
        </div>

        {/* Electric meter proof (read-only: recorded by the landlord) */}
        {meterReading && (
          <div className="rounded-2xl border border-edge bg-inset/50 p-3 space-y-2.5">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-bold text-fg">
                <Zap className="h-3.5 w-3.5 text-warning-fg" /> Meter reading
              </span>
              <span className="font-semibold text-muted tabular-nums">
                {meterReading.prev_reading} → {meterReading.curr_reading} kWh ·{" "}
                {meterReading.usage_kwh} kWh used
              </span>
            </div>
            {meterReading.meter_photo_url ? (
              <a
                href={meterReading.meter_photo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-xl border border-edge bg-card"
                aria-label="Open meter photo proof"
              >
                <img
                  src={meterReading.meter_photo_url}
                  alt="Electric meter reading proof"
                  className="h-32 w-full object-cover"
                />
              </a>
            ) : (
              <p className="text-[11px] text-muted">No meter photo attached for this reading.</p>
            )}
          </div>
        )}

        <p className="text-xs text-muted">
          {isSettled
            ? `Paid on ${formatDate(invoice.payment_date || invoice.date)}, settled on time.`
            : `Due on ${formatDate(invoice.due_date)}, please settle on time.`}
        </p>

        {/* Solid Action Button matching mockup */}
        <div className="pt-2">
          {canPay && onPayGCash ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onPayGCash(invoice);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#14233F] dark:bg-[#1D3560] py-3.5 px-4 text-sm font-bold text-white shadow-soft transition-all hover:opacity-95 active:scale-95 cursor-pointer"
            >
              <QrCode className="h-4 w-4" />
              <span>Pay Online</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePrint}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#14233F] dark:bg-[#1D3560] py-3.5 px-4 text-sm font-bold text-white shadow-soft transition-all hover:opacity-95 active:scale-95 cursor-pointer"
            >
              <span>Download receipt</span>
            </button>
          )}

          {/* Secondary print statement option if payable */}
          {canPay && (
            <button
              type="button"
              onClick={handlePrint}
              className="mt-2 flex w-full items-center justify-center gap-1.5 py-1 text-xs font-semibold text-muted hover:text-fg transition-colors cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Official Statement</span>
            </button>
          )}
        </div>

        {/* Hidden Printable Receipt for native PDF / Print preview */}
        <div className="hidden print:block">
          <ReceiptCard invoice={invoice} />
        </div>
      </div>
    </Modal>
  );
}
