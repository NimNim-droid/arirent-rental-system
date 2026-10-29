import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Camera,
  Home,
  Zap,
  Droplet,
  Layers,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  formatCurrency,
  formatDate,
  formatInvoiceNumber,
  formatUsage,
} from "@/lib/formatters";
import type { Bill } from "@/lib/types";

interface ReceiptCardProps {
  invoice: Bill;
}

function calculateDaysLeft(dueDateString?: string | null): number | null {
  if (!dueDateString) return null;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let due: Date;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dueDateString)) {
      const [year, month, day] = dueDateString.split("-").map(Number);
      due = new Date(year, month - 1, day);
    } else {
      due = new Date(dueDateString);
    }
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

/**
 * ReceiptCard Component
 * Modern statement of account matching the AriRent phone UI.
 * Formatted with clean itemized lines (Rent, Electricity with kWh, Water flat rate, Excess charges)
 * and print-friendly overrides for official physical receipts.
 */
export function ReceiptCard({ invoice }: ReceiptCardProps) {
  const paid = invoice.paid_amount ?? 0;
  const remaining =
    invoice.remaining_balance ?? Math.max(0, invoice.total_amount - paid);
  const isPaid = invoice.status === "paid" || remaining <= 0;
  const isPartiallyPaid = invoice.status === "partially_paid";
  const isOverdue = invoice.status === "overdue";
  const isPendingVerification = invoice.status === "pending_verification";
  const isVoided = invoice.status === "voided";

  const propertyName =
    invoice.property_name ||
    invoice.tenant?.property?.name ||
    "AriRent Residences";
  const residentName =
    invoice.tenant_name || invoice.tenant?.name || "Valued Resident";
  const roomNumber = invoice.room || invoice.tenant?.room || "—";
  const excessCharges = invoice.excess_charges || [];

  const formattedInvoiceNo = formatInvoiceNumber(
    invoice.id,
    invoice.date || invoice.due_date
  );

  const daysLeft = calculateDaysLeft(invoice.due_date);

  // Count itemized lines
  let lineCount = 3; // Rent, Electricity, Water
  if (excessCharges.length > 0) lineCount += excessCharges.length;
  if (invoice.late_fee > 0) lineCount += 1;

  // Reading submeter detail
  const latestReading = invoice.readings?.[0];

  return (
    <div
      id="printable-receipt"
      className="receipt-card mx-auto max-w-lg space-y-4 rounded-3xl border border-edge bg-card p-4 sm:p-6 text-sm shadow-card print:border-none print:p-0 print:shadow-none print:max-w-full"
    >
      {/* ================= 1. Dark Hero Header Banner ================= */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#121c32] via-[#1a2846] to-[#0f182c] p-5 text-white shadow-soft print:bg-white print:p-2 print:text-black print:border-b print:border-gray-300">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <span className="font-mono text-xs font-semibold text-white/70 print:text-gray-600">
              #{formattedInvoiceNo} &bull; Billing Cycle
            </span>
            <p className="text-[11px] font-medium uppercase tracking-wider text-white/60 print:text-gray-500">
              Total Balance Payable
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white tabular-nums print:text-black">
              {formatCurrency(isPaid ? invoice.total_amount : remaining)}
            </p>
          </div>

          <Badge
            variant={
              isPaid
                ? "success"
                : isPartiallyPaid
                ? "warning"
                : isOverdue
                ? "danger"
                : isPendingVerification
                ? "info"
                : isVoided
                ? "neutral"
                : "warning"
            }
            className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider print:border print:border-gray-400 print:text-black print:bg-transparent"
          >
            {isPaid
              ? "Paid"
              : isPartiallyPaid
              ? "Partial Payment"
              : isPendingVerification
              ? "Pending Verification"
              : isOverdue
              ? "Overdue"
              : isVoided
              ? "Cancelled"
              : "Pending Payment"}
          </Badge>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-white/15 pt-3 text-xs text-white/80 print:border-gray-300 print:text-gray-700">
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="h-4 w-4 shrink-0 text-[#C9A24B] print:hidden" />
            <div className="truncate">
              <span className="font-semibold text-white print:text-black">
                {propertyName}
              </span>
              <span className="mx-1.5 text-white/40">|</span>
              <span>Unit {roomNumber} &bull; {residentName}</span>
            </div>
          </div>
          <div className="shrink-0 text-right text-[11px] text-white/70 print:text-gray-600">
            Statement: {formatDate(invoice.date)}
          </div>
        </div>
      </div>

      {/* ================= 2. Due Date Alert Banner ================= */}
      {!isPaid && !isVoided && (
        <div
          className={`flex items-start gap-2.5 rounded-2xl border p-3 text-xs ${
            isOverdue || (daysLeft !== null && daysLeft <= 0)
              ? "border-danger-border bg-danger-bg/50 text-danger-fg"
              : daysLeft !== null && daysLeft <= 3
              ? "border-warning-border bg-warning-bg/60 text-warning-fg"
              : "border-info-border bg-info-bg/40 text-info-fg"
          } print:border-gray-300 print:bg-transparent print:text-black`}
        >
          <Clock className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="font-bold">
              Due on {formatDate(invoice.due_date)}
              {daysLeft !== null && (
                <span className="ml-1 font-semibold opacity-90">
                  {daysLeft > 0
                    ? `(${daysLeft} ${daysLeft === 1 ? "day" : "days"} left)`
                    : daysLeft === 0
                    ? "(Due Today)"
                    : `(${Math.abs(daysLeft)} days overdue)`}
                </span>
              )}
            </p>
            <p className="text-[11px] opacity-85 mt-0.5">
              {isOverdue || (daysLeft !== null && daysLeft < 0)
                ? "This invoice is past due. Please settle immediately to avoid additional penalties."
                : "Please pay before due date to keep your rental account in good standing."}
            </p>
          </div>
        </div>
      )}

      {/* ================= 3. Itemized Breakdown ================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-edge pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-fg flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-accent print:hidden" />
            <span>Itemized Breakdown</span>
          </h3>
          <span className="text-[11px] font-semibold text-muted">
            {lineCount} Line Items
          </span>
        </div>

        <div className="space-y-2 text-xs">
          {/* Monthly Base Rent */}
          <div className="flex items-start justify-between rounded-xl border border-edge/60 bg-hover/30 p-2.5">
            <div className="flex items-start gap-2.5 min-w-0">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                <Home className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <p className="font-bold text-fg">Monthly Base Rent</p>
                <p className="text-[11px] text-muted">
                  Standard lease &bull; Unit {roomNumber}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="font-bold text-fg tabular-nums">
                {formatCurrency(invoice.rent)}
              </span>
              <p className="text-[10px] text-muted font-medium">Fixed Rate</p>
            </div>
          </div>

          {/* Electricity Submeter */}
          <div className="flex items-start justify-between rounded-xl border border-edge/60 bg-hover/30 p-2.5">
            <div className="flex items-start gap-2.5 min-w-0">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-warning-bg text-warning-fg">
                <Zap className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <p className="font-bold text-fg">Electricity Submeter</p>
                <p className="text-[11px] text-muted">
                  {latestReading
                    ? `Prev: ${latestReading.prev_reading} kWh \u2022 Curr: ${latestReading.curr_reading} kWh`
                    : invoice.elec_usage > 0
                    ? `${formatUsage(invoice.elec_usage)} consumed`
                    : "Submeter monthly consumption"}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="font-bold text-fg tabular-nums">
                {formatCurrency(invoice.electricity)}
              </span>
              <p className="text-[10px] text-muted font-medium">Metered</p>
            </div>
          </div>

          {/* Water Utility */}
          <div className="flex items-start justify-between rounded-xl border border-edge/60 bg-hover/30 p-2.5">
            <div className="flex items-start gap-2.5 min-w-0">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-info-bg text-info-fg">
                <Droplet className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <p className="font-bold text-fg">Water Utility Service</p>
                <p className="text-[11px] text-muted">Fixed monthly rate</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="font-bold text-fg tabular-nums">
                {formatCurrency(invoice.water)}
              </span>
              <p className="text-[10px] text-muted font-medium">Fixed Rate</p>
            </div>
          </div>

          {/* Excess Charges (Incidental / Garbage / Maintenance) */}
          {excessCharges.map((charge) => (
            <div
              key={charge.id}
              className="flex items-start justify-between rounded-xl border border-edge/60 bg-hover/30 p-2.5"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="font-bold text-fg">{charge.title}</p>
                  <p className="text-[11px] text-muted truncate">
                    {charge.description || "Incidental charge"}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="font-bold text-fg tabular-nums">
                  {formatCurrency(charge.amount)}
                </span>
                <p className="text-[10px] text-muted font-medium">Itemized</p>
              </div>
            </div>
          ))}

          {/* Late Surcharge (if applied) */}
          {invoice.late_fee > 0 && (
            <div className="flex items-start justify-between rounded-xl border border-danger-border bg-danger-bg/25 p-2.5 text-danger-fg">
              <div className="flex items-start gap-2.5 min-w-0">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-danger-bg text-danger-fg">
                  <AlertTriangle className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="font-bold">Late Fee Surcharge</p>
                  <p className="text-[11px] opacity-80">
                    Penalty for overdue payment
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="font-bold tabular-nums">
                  +{formatCurrency(invoice.late_fee)}
                </span>
                <p className="text-[10px] opacity-80 font-medium">Penalty</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= 4. Totals Calculation Box ================= */}
      <div className="rounded-2xl border border-edge bg-inset/50 p-3.5 space-y-2 text-xs">
        <div className="flex justify-between text-muted">
          <span>Subtotal</span>
          <span className="font-semibold text-fg tabular-nums">
            {formatCurrency(invoice.total_amount)}
          </span>
        </div>

        {paid > 0 && (
          <div className="flex justify-between text-success-fg font-medium">
            <span>Less: Payments Received</span>
            <span className="tabular-nums font-bold">
              −{formatCurrency(paid)}
            </span>
          </div>
        )}

        <div className="flex justify-between items-center border-t border-edge/80 pt-2 text-sm font-black text-fg">
          <span>{isPaid ? "Total Settled" : "Outstanding Payable"}</span>
          <span
            className={`text-base tabular-nums ${
              isPaid ? "text-success-fg" : "text-accent"
            }`}
          >
            {formatCurrency(isPaid ? invoice.total_amount : remaining)}
          </span>
        </div>
      </div>

      {/* ================= 5. Paid Receipt Stamp (When Settled) ================= */}
      {isPaid && (
        <div className="rounded-2xl border-2 border-dashed border-success-border bg-success-bg/40 p-3.5 text-xs text-success-fg space-y-1.5 print:border-gray-800 print:bg-transparent print:text-black">
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-success-fg print:hidden" />
            <span>Payment Acknowledged & Settled</span>
          </div>
          {invoice.payments && invoice.payments.length > 0 ? (
            <div className="text-[11px] space-y-1 pt-1 border-t border-success-border/50 text-success-fg/90 print:border-gray-300 print:text-gray-700">
              {invoice.payments.map((p) => (
                <div key={p.id} className="flex justify-between">
                  <span>
                    {p.payment_method?.toUpperCase()} Ref: #{p.transaction_reference}
                  </span>
                  <span className="font-bold tabular-nums">
                    {formatCurrency(p.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-success-fg/80 print:text-gray-600">
              Settled on {formatDate(invoice.payment_date || invoice.due_date)}.
            </p>
          )}
        </div>
      )}

      {/* ================= 6. Sub-Meter Photographic Proof ================= */}
      {invoice.readings && invoice.readings.some((r) => r.meter_photo_url) && (
        <div className="rounded-2xl border border-edge bg-card p-3 space-y-2 text-xs print:border-gray-300 print:bg-white">
          <p className="flex items-center gap-1.5 font-bold text-fg uppercase tracking-wider text-[11px] print:text-black">
            <Camera className="h-3.5 w-3.5 text-accent print:hidden" /> Sub-Meter Proof
          </p>
          <div className="grid grid-cols-2 gap-2">
            {invoice.readings
              .filter((r) => r.meter_photo_url)
              .map((reading) => (
                <div
                  key={reading.id}
                  className="rounded-lg border border-edge overflow-hidden bg-card print:border-gray-300"
                >
                  <img
                    src={reading.meter_photo_url || ""}
                    alt="Meter proof"
                    className="h-20 w-full object-cover"
                  />
                  <p className="p-1 text-[10px] text-muted text-center print:text-gray-700">
                    {reading.type || "Electric"}: {reading.usage_kwh} kWh
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ================= 7. Receipt Bottom Sign-off ================= */}
      <div className="text-center pt-2 border-t border-dashed border-edge text-[11px] text-muted print:border-gray-300 print:text-gray-600 space-y-0.5">
        <p className="font-medium text-fg print:text-black">
          Thank you for being a valued resident of AriRent!
        </p>
        <p className="text-[10px] text-faint print:text-gray-500">
          Official electronic statement generated by AriRent Property Management System.
        </p>
      </div>
    </div>
  );
}
