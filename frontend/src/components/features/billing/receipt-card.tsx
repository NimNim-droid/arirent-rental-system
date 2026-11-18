import { Badge, type BadgeProps } from "@/components/ui/badge";
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

const STATUS_META: Record<Bill["status"], { label: string; variant: BadgeProps["variant"] }> = {
  paid: { label: "Paid", variant: "success" },
  unpaid: { label: "Unpaid", variant: "warning" },
  partially_paid: { label: "Partially paid", variant: "warning" },
  pending_verification: { label: "Pending approval", variant: "info" },
  overdue: { label: "Overdue", variant: "danger" },
  voided: { label: "Cancelled", variant: "neutral" },
};

function isPastDue(dueDateString?: string | null): boolean {
  if (!dueDateString) return false;
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

  return due.getTime() < today.getTime();
}

/**
 * Plain statement of account used for the admin invoice view, the tenant
 * download, and printing. Layout: header, details, itemized table, totals,
 * payments, and meter proof. Class names prefixed with `rc-` are styled by the
 * print helper (lib/print.ts) so the printed copy matches the screen.
 */
export function ReceiptCard({ invoice }: ReceiptCardProps) {
  const paid = invoice.paid_amount ?? 0;
  const remaining =
    invoice.remaining_balance ?? Math.max(0, invoice.total_amount - paid);
  const isVoided = invoice.status === "voided";
  const isPaid = !isVoided && (invoice.status === "paid" || remaining <= 0);
  const pastDue = !isPaid && !isVoided && (invoice.status === "overdue" || isPastDue(invoice.due_date));

  const propertyName =
    invoice.property_name || invoice.tenant?.property?.name || "AriRent Residences";
  const residentName = invoice.tenant_name || invoice.tenant?.name || "Resident";
  const roomNumber = invoice.room || invoice.tenant?.room || "—";
  const excessCharges = invoice.excess_charges || [];
  const payments = (invoice.payments || []).filter((p) => p.status === "confirmed");

  const invoiceNo = formatInvoiceNumber(invoice.id, invoice.date || invoice.due_date);
  const status = STATUS_META[invoice.status] ?? {
    label: invoice.status,
    variant: "neutral" as const,
  };

  const electricReading = (invoice.readings || []).find((r) => r.type !== "water");
  const meterPhotos = (invoice.readings || []).filter((r) => r.meter_photo_url);

  const electricityDetail = electricReading
    ? `${electricReading.prev_reading} → ${electricReading.curr_reading} kWh (${formatUsage(electricReading.usage_kwh)})`
    : invoice.elec_usage > 0
    ? formatUsage(invoice.elec_usage)
    : null;

  const th = "py-2 text-xs font-medium text-muted border-b border-edge";
  const td = "py-2.5 align-top border-b border-edge/60";

  return (
    <div
      id="printable-receipt"
      className="receipt-card mx-auto max-w-lg rounded-lg border border-edge bg-card p-5 text-sm text-fg print:border-none print:p-0"
    >
      {/* Header */}
      <div className="rc-header flex items-start justify-between gap-3 border-b border-edge pb-4">
        <div className="min-w-0">
          <p className="rc-title text-base font-semibold text-fg">{propertyName}</p>
          <p className="rc-muted text-xs text-muted">Statement of Account</p>
        </div>
        <div className="text-right shrink-0">
          <p className="rc-mono font-mono text-xs text-muted">{invoiceNo}</p>
          <Badge variant={status.variant} className="mt-1 rc-badge">
            {status.label}
          </Badge>
        </div>
      </div>

      {/* Details */}
      <dl className="rc-info grid grid-cols-2 gap-x-4 gap-y-3 border-b border-edge py-4 text-xs">
        <div>
          <dt className="rc-label text-muted">Tenant</dt>
          <dd className="rc-value font-medium text-fg">{residentName}</dd>
        </div>
        <div>
          <dt className="rc-label text-muted">Unit</dt>
          <dd className="rc-value font-medium text-fg">Room {roomNumber}</dd>
        </div>
        <div>
          <dt className="rc-label text-muted">Statement date</dt>
          <dd className="rc-value font-medium text-fg">{formatDate(invoice.date)}</dd>
        </div>
        <div>
          <dt className="rc-label text-muted">Due date</dt>
          <dd className={`rc-value font-medium ${pastDue ? "text-danger-fg" : "text-fg"}`}>
            {formatDate(invoice.due_date)}
            {pastDue && " (past due)"}
          </dd>
        </div>
      </dl>

      {/* Itemized charges */}
      <table className="rc-table mt-4 w-full text-xs">
        <thead>
          <tr>
            <th className={`${th} text-left`}>Description</th>
            <th className={`${th} text-right amt`}>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={td}>Monthly rent</td>
            <td className={`${td} text-right tabular-nums amt`}>{formatCurrency(invoice.rent)}</td>
          </tr>
          <tr>
            <td className={td}>
              Electricity
              {electricityDetail && (
                <span className="rc-muted block text-[11px] text-muted">{electricityDetail}</span>
              )}
            </td>
            <td className={`${td} text-right tabular-nums amt`}>
              {formatCurrency(invoice.electricity)}
            </td>
          </tr>
          <tr>
            <td className={td}>Water</td>
            <td className={`${td} text-right tabular-nums amt`}>{formatCurrency(invoice.water)}</td>
          </tr>
          {excessCharges.map((charge) => (
            <tr key={charge.id}>
              <td className={td}>
                {charge.title}
                {charge.description && (
                  <span className="rc-muted block text-[11px] text-muted">{charge.description}</span>
                )}
              </td>
              <td className={`${td} text-right tabular-nums amt`}>
                {formatCurrency(charge.amount)}
              </td>
            </tr>
          ))}
          {invoice.late_fee > 0 && (
            <tr>
              <td className={td}>Late fee</td>
              <td className={`${td} text-right tabular-nums amt`}>
                {formatCurrency(invoice.late_fee)}
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr>
            <td className="rc-total pt-3 font-semibold text-fg">Total</td>
            <td className="rc-total amt pt-3 text-right font-semibold tabular-nums text-fg">
              {formatCurrency(invoice.total_amount)}
            </td>
          </tr>
          {paid > 0 && (
            <tr>
              <td className="py-1 text-muted">Amount paid</td>
              <td className="amt py-1 text-right tabular-nums text-muted">
                {formatCurrency(paid)}
              </td>
            </tr>
          )}
          {!isPaid && !isVoided && (
            <tr>
              <td className="rc-total py-1 font-semibold text-fg">Balance due</td>
              <td className="rc-total amt py-1 text-right font-semibold tabular-nums text-fg">
                {formatCurrency(remaining)}
              </td>
            </tr>
          )}
        </tfoot>
      </table>

      {/* Payments */}
      {isPaid && (
        <p className="rc-muted mt-4 text-xs text-muted">
          Paid in full{invoice.payment_date || invoice.approved_date
            ? ` on ${formatDate(invoice.payment_date || invoice.approved_date)}`
            : ""}
          .
        </p>
      )}

      {payments.length > 0 && (
        <div className="rc-section mt-4 border-t border-edge pt-3">
          <p className="rc-label mb-1 text-xs font-medium text-muted">Payments received</p>
          {payments.map((p) => (
            <div key={p.id} className="flex justify-between gap-3 py-1 text-xs">
              <span className="rc-muted text-muted">
                {p.payment_method ? p.payment_method.toUpperCase() : "Payment"}
                {p.transaction_reference ? ` · Ref ${p.transaction_reference}` : ""}
              </span>
              <span className="tabular-nums text-fg">{formatCurrency(p.amount)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Meter proof */}
      {meterPhotos.length > 0 && (
        <div className="rc-section mt-4 border-t border-edge pt-3">
          <p className="rc-label mb-2 text-xs font-medium text-muted">Meter reading photo</p>
          <div className="grid grid-cols-2 gap-2">
            {meterPhotos.map((reading) => (
              <div key={reading.id}>
                <img
                  src={reading.meter_photo_url || ""}
                  alt="Meter reading"
                  className="h-20 w-full rounded border border-edge object-cover"
                />
                <p className="rc-muted mt-1 text-[11px] text-muted">
                  {formatUsage(reading.usage_kwh)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <p className="rc-footer mt-5 border-t border-edge pt-3 text-center text-[11px] text-muted">
        AriRent Property Management
      </p>
    </div>
  );
}
