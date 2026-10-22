import { Printer, Camera, CheckCircle2, Clock, AlertTriangle, FileText, Wrench, Calendar, Building2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, formatInvoiceNumber } from "@/lib/formatters";
import type { Bill } from "@/lib/types";

interface InvoiceModalProps {
  invoice: Bill | null;
  onClose: () => void;
  onRecordPayment?: (invoice: Bill) => void;
}

export function InvoiceModal({ invoice, onClose, onRecordPayment }: InvoiceModalProps) {
  if (!invoice) return null;

  const paid = invoice.paid_amount ?? 0;
  const remaining = invoice.remaining_balance ?? Math.max(0, invoice.total_amount - paid);
  const isSettled = invoice.status === "paid" || remaining <= 0;

  const propertyName = invoice.property_name || invoice.tenant?.property?.name || "AriRent Property";
  const residentName = invoice.tenant_name || invoice.tenant?.name || "Resident";
  const roomNumber = invoice.room || invoice.tenant?.room || "—";
  const excessChargesTotal = (invoice.excess_charges || []).reduce(
    (sum, c) => sum + Number(c.amount || 0),
    0
  );

  const formattedInvoiceNo = formatInvoiceNumber(invoice.id, invoice.date || invoice.due_date);

  return (
    <Modal
      open={!!invoice}
      onClose={onClose}
      title={`Invoice #${formattedInvoiceNo}`}
      footer={
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            {!isSettled && onRecordPayment && invoice.status !== "voided" && (
              <Button size="sm" onClick={() => onRecordPayment(invoice)}>
                Record Payment
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Print
            </Button>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose}>
            Done
          </Button>
        </div>
      }
    >
      <div id="printable-statement" className="space-y-4 text-sm">
        {/* Printable / Top Statement Header */}
        <div className="rounded-2xl border border-edge bg-inset/50 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-edge/60 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-fg">
                  AriRent Property Management
                </span>
                <span className="rounded-md bg-accent/10 px-2 py-0.5 font-mono text-[11px] font-bold text-accent">
                  #{formattedInvoiceNo}
                </span>
              </div>
              <p className="text-xs text-muted flex items-center gap-1.5 mt-0.5">
                <Building2 className="h-3.5 w-3.5 text-accent" />
                <span>{propertyName}</span>
                <span>•</span>
                <span className="font-semibold text-fg">Unit / Room {roomNumber}</span>
              </p>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1">
              <Badge
                dot
                variant={
                  invoice.status === "paid"
                    ? "success"
                    : invoice.status === "partially_paid"
                    ? "warning"
                    : invoice.status === "voided"
                    ? "neutral"
                    : "danger"
                }
              >
                {invoice.status === "partially_paid"
                  ? "Partially Paid"
                  : invoice.status === "pending_verification"
                  ? "Pending Approval"
                  : invoice.status === "voided"
                  ? "Cancelled"
                  : invoice.status}
              </Badge>
              {invoice.date && (
                <span className="text-[11px] text-muted flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>Issued: {formatDate(invoice.date)}</span>
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-[11px] text-muted font-medium">Billed To (Resident)</p>
              <p className="font-bold text-fg text-sm">{residentName}</p>
              <p className="text-[11px] text-muted">Primary Tenant</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-muted font-medium">Payment Due Date</p>
              <p className="font-bold text-accent text-sm">{formatDate(invoice.due_date)}</p>
              {invoice.notes && (
                <p className="text-[10px] text-muted truncate">{invoice.notes}</p>
              )}
            </div>
          </div>
        </div>

        {/* Itemized Charges Breakdown */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-accent" />
              Itemized Charge Breakdown
            </p>
            <span className="text-[11px] text-muted">Currency: PHP (₱)</span>
          </div>

          {/* Standard Monthly Charges Table */}
          <div className="rounded-xl border border-edge divide-y divide-edge/60 bg-card overflow-hidden">
            {/* Rent */}
            <div className="flex items-center justify-between p-3 text-xs">
              <div>
                <p className="font-semibold text-fg">Monthly Room Rent</p>
                <p className="text-[11px] text-muted">Scheduled base lease rent</p>
              </div>
              <span className="tabular-nums font-bold text-fg text-sm">
                {formatCurrency(invoice.rent)}
              </span>
            </div>

            {/* Electricity */}
            <div className="flex items-center justify-between p-3 text-xs">
              <div>
                <p className="font-semibold text-fg">
                  Electricity Consumption
                  {invoice.elec_usage > 0 && (
                    <span className="ml-1.5 font-normal text-muted">({invoice.elec_usage} kWh)</span>
                  )}
                </p>
                <p className="text-[11px] text-muted">Based on electric sub-meter reading</p>
              </div>
              <span className="tabular-nums font-bold text-fg text-sm">
                {formatCurrency(invoice.electricity)}
              </span>
            </div>

            {/* Water */}
            <div className="flex items-center justify-between p-3 text-xs">
              <div>
                <p className="font-semibold text-fg">Water Utility</p>
                <p className="text-[11px] text-muted">Fixed monthly flat rate</p>
              </div>
              <span className="tabular-nums font-bold text-fg text-sm">
                {formatCurrency(invoice.water)}
              </span>
            </div>

            {/* Overdue Late Fee */}
            {invoice.late_fee > 0 && (
              <div className="flex items-center justify-between p-3 text-xs bg-danger-bg/40">
                <div>
                  <p className="font-semibold text-danger-fg">Overdue Late Surcharge</p>
                  <p className="text-[11px] text-danger-fg/80">Penalty for late settlement</p>
                </div>
                <span className="tabular-nums font-bold text-danger-fg text-sm">
                  +{formatCurrency(invoice.late_fee)}
                </span>
              </div>
            )}
          </div>

          {/* Attached Incidental / Added Charges Section */}
          {invoice.excess_charges && invoice.excess_charges.length > 0 && (
            <div className="rounded-xl border border-accent/30 bg-accent-soft/30 p-3 space-y-2.5">
              <div className="flex items-center justify-between border-b border-accent/20 pb-1.5">
                <span className="text-xs font-bold text-fg flex items-center gap-1.5">
                  <Wrench className="h-3.5 w-3.5 text-accent" />
                  Additional Incidental Charges ({invoice.excess_charges.length})
                </span>
                <span className="text-xs font-bold text-accent tabular-nums">
                  Subtotal: {formatCurrency(excessChargesTotal)}
                </span>
              </div>

              <div className="space-y-2">
                {invoice.excess_charges.map((charge) => (
                  <div
                    key={charge.id}
                    className="rounded-lg border border-edge bg-card p-2.5 flex flex-col sm:flex-row sm:items-start justify-between gap-2 text-xs shadow-2xs"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-fg text-xs">{charge.title}</span>
                        {charge.charge_date && (
                          <span className="rounded bg-inset px-1.5 py-0.5 text-[10px] text-muted border border-edge">
                            Date: {formatDate(charge.charge_date)}
                          </span>
                        )}
                        <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent capitalize">
                          {charge.status || "billed"}
                        </span>
                      </div>
                      <p className="text-xs text-muted leading-relaxed">
                        {charge.description ? (
                          charge.description
                        ) : (
                          <span className="italic text-faint">Incidental charge added to monthly statement.</span>
                        )}
                      </p>
                    </div>

                    <div className="sm:text-right shrink-0 pt-1 sm:pt-0">
                      <span className="font-extrabold text-fg tabular-nums text-sm">
                        {formatCurrency(charge.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Financial Totals & Balance Bar */}
          <div className="rounded-xl border border-edge bg-inset/40 p-3.5 space-y-2">
            <div className="flex justify-between text-sm font-bold text-fg">
              <span>Total Invoice Amount</span>
              <span className="tabular-nums font-extrabold text-base text-fg">
                {formatCurrency(invoice.total_amount)}
              </span>
            </div>

            <div className="flex justify-between text-xs font-semibold text-success-fg">
              <span>Less: Total Payments Confirmed</span>
              <span className="tabular-nums">−{formatCurrency(paid)}</span>
            </div>

            <div className="flex justify-between text-base font-extrabold text-accent border-t border-dashed border-edge pt-2.5">
              <span>Net Remaining Balance Due</span>
              <span className="tabular-nums">{formatCurrency(remaining)}</span>
            </div>
          </div>
        </div>

        {/* Sub-Meter Photographic Evidence */}
        {invoice.readings && invoice.readings.some((r) => r.meter_photo_url) && (
          <div className="rounded-xl border border-edge bg-inset p-3 space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-bold text-fg uppercase tracking-wider">
              <Camera className="h-3.5 w-3.5 text-accent" /> Photographic Sub-Meter Proof
            </p>
            <div className="grid grid-cols-2 gap-2">
              {invoice.readings
                .filter((r) => r.meter_photo_url)
                .map((reading) => (
                  <div key={reading.id} className="group relative overflow-hidden rounded-lg border border-edge bg-card">
                    <img
                      src={reading.meter_photo_url || ""}
                      alt="Sub-meter proof"
                      className="h-28 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="p-1.5 text-[10px] text-muted">
                      <span className="capitalize font-semibold text-fg">{reading.type || "Electric"}</span>:{" "}
                      {reading.usage_kwh} kWh ({formatCurrency(reading.amount)})
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Payment Transaction Ledger */}
        {invoice.payments && invoice.payments.length > 0 && (
          <div className="rounded-xl border border-edge bg-inset p-3 space-y-2">
            <p className="text-xs font-bold text-fg uppercase tracking-wider">
              Payment Transaction Ledger ({invoice.payments.length})
            </p>
            <div className="space-y-1.5">
              {invoice.payments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-edge bg-card p-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      {p.status === "confirmed" ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-success-fg" />
                      ) : p.status === "pending" ? (
                        <Clock className="h-3.5 w-3.5 text-warning-fg" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5 text-danger-fg" />
                      )}
                      <span className="font-semibold text-fg uppercase">{p.payment_method}</span>
                      <span className="font-mono text-[10px] text-muted">#{p.transaction_reference}</span>
                    </div>
                    <p className="text-[10px] text-muted">{p.paid_at || p.created_at}</p>
                  </div>
                  <span className="font-bold tabular-nums text-fg">{formatCurrency(p.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
