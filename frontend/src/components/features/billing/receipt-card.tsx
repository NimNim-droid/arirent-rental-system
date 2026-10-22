import { Building2, Calendar, CheckCircle2, Clock, AlertTriangle, Camera, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, formatInvoiceNumber } from "@/lib/formatters";
import type { Bill } from "@/lib/types";

interface ReceiptCardProps {
  invoice: Bill;
}

/**
 * ReceiptCard Component
 * Displays a clean, modern digital receipt style statement of account.
 * Automatically adapts:
 * - When UNPAID: Acts as a Billing Statement notice with due date and balance due.
 * - When PAID: Acts as an Official Receipt with green payment stamp and transaction reference.
 */
export function ReceiptCard({ invoice }: ReceiptCardProps) {
  const paid = invoice.paid_amount ?? 0;
  const remaining = invoice.remaining_balance ?? Math.max(0, invoice.total_amount - paid);
  const isPaid = invoice.status === "paid" || remaining <= 0;
  const isPartiallyPaid = invoice.status === "partially_paid";
  const isVoided = invoice.status === "voided";

  const propertyName = invoice.property_name || invoice.tenant?.property?.name || "AriRent Residences";
  const residentName = invoice.tenant_name || invoice.tenant?.name || "Valued Resident";
  const roomNumber = invoice.room || invoice.tenant?.room || "—";
  const excessCharges = invoice.excess_charges || [];

  const formattedInvoiceNo = formatInvoiceNumber(
    invoice.id,
    invoice.date || invoice.issue_date || invoice.due_date || invoice.created_at
  );

  return (
    <div
      id="printable-receipt"
      className="receipt-card max-w-lg mx-auto rounded-2xl border border-edge bg-card p-5 sm:p-6 text-sm shadow-sm space-y-4 print:border-none print:shadow-none print:p-0 print:max-w-full"
    >
      {/* ================= 1. Receipt Top Header ================= */}
      <div className="text-center space-y-1 border-b border-edge/60 pb-4 print:border-gray-300">
        <h2 className="text-base sm:text-lg font-black tracking-tight text-fg print:text-black">
          ARIRENT RESIDENCES
        </h2>
        <p className="text-xs text-muted flex items-center justify-center gap-1.5 print:text-gray-600">
          <Building2 className="h-3.5 w-3.5 text-accent print:hidden" />
          <span>{propertyName}</span>
          <span>•</span>
          <span className="font-semibold text-fg print:text-black">Unit / Room {roomNumber}</span>
        </p>

        {/* Dynamic Title based on payment status */}
        <div className="pt-2 flex items-center justify-center gap-2">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-accent print:text-black">
            {isPaid
              ? "Official Payment Receipt"
              : isPartiallyPaid
              ? "Partial Payment Statement"
              : isVoided
              ? "Cancelled Invoice"
              : "Rental Billing Statement"}
          </span>
          <Badge
            dot
            variant={
              isPaid
                ? "success"
                : isPartiallyPaid
                ? "warning"
                : isVoided
                ? "neutral"
                : "danger"
            }
            className="print:border print:border-gray-400 print:text-black print:bg-transparent"
          >
            {isPartiallyPaid
              ? "Partially Paid"
              : invoice.status === "pending_verification"
              ? "Pending Approval"
              : isVoided
              ? "Cancelled"
              : invoice.status}
          </Badge>
        </div>
      </div>

      {/* ================= 2. Receipt Metadata ================= */}
      <div className="grid grid-cols-2 gap-2 text-xs py-1">
        <div className="space-y-1">
          <p className="text-muted print:text-gray-600">
            Receipt No:{" "}
            <span className="font-mono font-bold text-fg print:text-black">
              #{formattedInvoiceNo}
            </span>
          </p>
          <p className="text-muted print:text-gray-600">
            Resident: <span className="font-bold text-fg print:text-black">{residentName}</span>
          </p>
        </div>
        <div className="space-y-1 text-right">
          {invoice.date && (
            <p className="text-muted print:text-gray-600">
              Date: <span className="font-medium text-fg print:text-black">{formatDate(invoice.date)}</span>
            </p>
          )}
          <p className="text-muted print:text-gray-600">
            Due Date:{" "}
            <span className="font-bold text-accent print:text-black">
              {formatDate(invoice.due_date)}
            </span>
          </p>
        </div>
      </div>

      {/* Dashed separator */}
      <div className="border-b border-dashed border-edge print:border-gray-300" />

      {/* ================= 3. Itemized Charges List ================= */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted print:text-gray-600">
          <span>Charge Description</span>
          <span>Amount (PHP)</span>
        </div>

        <div className="space-y-1.5 text-xs">
          {/* Monthly Room Rent */}
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-fg print:text-black">Room Rent</p>
              <p className="text-[10px] text-muted print:text-gray-500">Monthly scheduled lease</p>
            </div>
            <span className="font-bold tabular-nums text-fg print:text-black">
              {formatCurrency(invoice.rent)}
            </span>
          </div>

          {/* Electricity Consumption */}
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-fg print:text-black">Electricity</p>
              <p className="text-[10px] text-muted print:text-gray-500">
                {invoice.elec_usage > 0 ? `Sub-meter: ${invoice.elec_usage} kWh` : "Sub-meter consumption"}
              </p>
            </div>
            <span className="font-bold tabular-nums text-fg print:text-black">
              {formatCurrency(invoice.electricity)}
            </span>
          </div>

          {/* Water Utility */}
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-fg print:text-black">Water Utility</p>
              <p className="text-[10px] text-muted print:text-gray-500">Fixed monthly rate</p>
            </div>
            <span className="font-bold tabular-nums text-fg print:text-black">
              {formatCurrency(invoice.water)}
            </span>
          </div>

          {/* Incidental / Excess Charges */}
          {excessCharges.map((charge) => (
            <div key={charge.id} className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-fg print:text-black flex items-center gap-1">
                  <Wrench className="h-3 w-3 text-accent print:hidden" />
                  <span>{charge.title}</span>
                </p>
                {charge.description && (
                  <p className="text-[10px] text-muted print:text-gray-500">{charge.description}</p>
                )}
              </div>
              <span className="font-bold tabular-nums text-fg print:text-black">
                {formatCurrency(charge.amount)}
              </span>
            </div>
          ))}

          {/* Overdue Surcharge */}
          {invoice.late_fee > 0 && (
            <div className="flex justify-between items-start text-danger-fg print:text-black">
              <div>
                <p className="font-semibold">Late Fee Surcharge</p>
                <p className="text-[10px] text-danger-fg/80 print:text-gray-500">Penalty for late payment</p>
              </div>
              <span className="font-bold tabular-nums">+{formatCurrency(invoice.late_fee)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Dashed separator */}
      <div className="border-b border-dashed border-edge print:border-gray-300" />

      {/* ================= 4. Receipt Totals & Balance ================= */}
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between text-muted print:text-gray-600">
          <span>Total Billed Amount</span>
          <span className="font-bold text-fg tabular-nums print:text-black">
            {formatCurrency(invoice.total_amount)}
          </span>
        </div>

        {paid > 0 && (
          <div className="flex justify-between text-success-fg print:text-gray-700 font-medium">
            <span>Less: Payments Received</span>
            <span className="tabular-nums font-bold">−{formatCurrency(paid)}</span>
          </div>
        )}

        <div className="flex justify-between items-center pt-2 border-t border-edge text-sm font-black text-fg print:border-gray-400 print:text-black">
          <span>{isVoided ? "Original Total" : "Remaining Balance"}</span>
          <span className={`tabular-nums text-base ${isPaid ? "text-success-fg print:text-black" : "text-accent print:text-black"}`}>
            {formatCurrency(remaining)}
          </span>
        </div>
      </div>

      {/* ================= 5. Authentic Receipt Stamp (When Paid) ================= */}
      {isPaid && (
        <div className="rounded-xl border-2 border-dashed border-success-border bg-success-bg/40 p-3 text-xs text-success-fg space-y-1 print:border-gray-800 print:bg-gray-50 print:text-black">
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-success-fg print:hidden" />
            <span>Payment Acknowledged & Settled</span>
          </div>
          {invoice.payments && invoice.payments.length > 0 ? (
            <div className="text-[11px] space-y-0.5 text-success-fg/90 print:text-gray-700">
              {invoice.payments.map((p) => (
                <div key={p.id} className="flex justify-between">
                  <span>
                    {p.payment_method?.toUpperCase()} Ref: #{p.transaction_reference}
                  </span>
                  <span className="font-bold tabular-nums">{formatCurrency(p.amount)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-success-fg/80 print:text-gray-600">
              Paid in full on {formatDate(invoice.updated_at || invoice.due_date)}.
            </p>
          )}
        </div>
      )}

      {/* ================= 6. Sub-Meter Photographic Proof (If attached) ================= */}
      {invoice.readings && invoice.readings.some((r) => r.meter_photo_url) && (
        <div className="rounded-xl border border-edge bg-inset/40 p-3 space-y-2 text-xs print:border-gray-300 print:bg-white">
          <p className="flex items-center gap-1.5 font-bold text-fg uppercase tracking-wider text-[11px] print:text-black">
            <Camera className="h-3.5 w-3.5 text-accent print:hidden" /> Sub-Meter Proof
          </p>
          <div className="grid grid-cols-2 gap-2">
            {invoice.readings
              .filter((r) => r.meter_photo_url)
              .map((reading) => (
                <div key={reading.id} className="rounded-lg border border-edge overflow-hidden bg-card print:border-gray-300">
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
      <div className="text-center pt-2 border-t border-dashed border-edge text-[11px] text-muted print:border-gray-300 print:text-gray-600 space-y-1">
        <p className="font-medium text-fg print:text-black">
          Thank you for being a valued resident of AriRent!
        </p>
        <p className="text-[10px] text-faint print:text-gray-500">
          Official electronic receipt generated by AriRent Property Management System.
        </p>
      </div>
    </div>
  );
}
