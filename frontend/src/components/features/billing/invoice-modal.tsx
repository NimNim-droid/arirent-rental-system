import { Printer } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
import type { Bill } from "@/lib/types";

interface InvoiceModalProps {
  invoice: Bill | null;
  onClose: () => void;
}

export function InvoiceModal({ invoice, onClose }: InvoiceModalProps) {
  if (!invoice) return null;

  return (
    <Modal
      open={!!invoice}
      onClose={onClose}
      title={`Statement of Account: ${invoice.id}`}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print Statement
          </Button>
          <Button size="sm" onClick={onClose}>
            Done
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-sm">
        <div className="flex justify-between border-b border-edge pb-3">
          <div>
            <p className="text-xs text-muted">Resident</p>
            <p className="font-bold text-fg">{invoice.tenant_name}</p>
            <p className="text-xs text-muted">Room {invoice.room}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted">Rent Due Date</p>
            <p className="font-bold text-accent">{invoice.due_date}</p>
            {invoice.notes && (
              <p className="text-[11px] font-medium text-muted mt-0.5 max-w-[200px]">{invoice.notes}</p>
            )}
          </div>
        </div>

        <div className="space-y-2 py-2">
          <div className="flex justify-between text-xs text-muted">
            <span>Room Rent</span>
            <span className="tabular-nums">{formatCurrency(invoice.rent)}</span>
          </div>
          <div className="flex justify-between text-xs text-muted">
            <span>Electricity</span>
            <span className="tabular-nums">
              {formatCurrency(invoice.electricity)}
            </span>
          </div>
          <div className="flex justify-between text-xs text-muted">
            <span>Water</span>
            <span className="tabular-nums">{formatCurrency(invoice.water)}</span>
          </div>
          {invoice.late_fee > 0 && (
            <div className="flex justify-between text-xs text-danger-fg">
              <span>Late Fee</span>
              <span className="tabular-nums">
                {formatCurrency(invoice.late_fee)}
              </span>
            </div>
          )}
          <div className="mt-2 flex justify-between border-t border-edge pt-2 text-base font-bold text-fg">
            <span>Total Due</span>
            <span className="text-accent tabular-nums">
              {formatCurrency(invoice.total_amount)}
            </span>
          </div>
        </div>

        {/* Payment & Verification Details */}
        {(invoice.gcash_ref || invoice.receipt_url || invoice.status === "voided" || invoice.reject_reason) && (
          <div className="rounded-xl border border-edge bg-inset p-3 space-y-2 text-xs">
            <p className="font-bold text-fg text-[11px] uppercase tracking-wider">
              Payment & Verification Info
            </p>
            {invoice.gcash_ref && (
              <div className="flex justify-between">
                <span className="text-muted">GCash Reference</span>
                <span className="font-mono font-bold text-fg">{invoice.gcash_ref}</span>
              </div>
            )}
            {invoice.reject_reason && (
              <div className="flex justify-between text-danger-fg">
                <span className="font-semibold">Rejection Reason</span>
                <span>{invoice.reject_reason}</span>
              </div>
            )}
            {invoice.receipt_url && (
              <div className="space-y-1.5 pt-1 border-t border-edge">
                <div className="flex justify-between items-center">
                  <span className="text-muted">Uploaded Receipt</span>
                  <a
                    href={invoice.receipt_url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-accent hover:underline"
                  >
                    Open Full Image ↗
                  </a>
                </div>
                <img
                  src={invoice.receipt_url}
                  alt="GCash Receipt"
                  className="max-h-40 rounded-lg object-contain border border-edge bg-card mx-auto"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
