import { Printer, Wallet, QrCode } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { formatInvoiceNumber } from "@/lib/formatters";
import { printReceiptElement } from "@/lib/print";
import { ReceiptCard } from "./receipt-card";
import type { Bill } from "@/lib/types";

export interface InvoiceModalProps {
  open?: boolean;
  invoice: Bill | null;
  onClose: () => void;
  onRecordPayment?: (invoice: Bill) => void;
  onPayGCash?: (invoice: Bill) => void;
}

/**
 * InvoiceModal Component
 * Modal wrapper that displays the authentic ReceiptCard.
 * Supports action buttons for:
 * - Admin: Recording offline cash payment
 * - Tenant: Paying via GCash
 * - Both: Printing or saving as clean PDF receipt
 */
export function InvoiceModal({
  open,
  invoice,
  onClose,
  onRecordPayment,
  onPayGCash,
}: InvoiceModalProps) {
  const isOpen = open !== undefined ? open && !!invoice : !!invoice;
  if (!isOpen || !invoice) return null;

  const paid = invoice.paid_amount ?? 0;
  const remaining = invoice.remaining_balance ?? Math.max(0, invoice.total_amount - paid);
  const isSettled = invoice.status === "paid" || remaining <= 0;
  const isVoided = invoice.status === "voided";

  const formattedInvoiceNo = formatInvoiceNumber(
    invoice.id,
    invoice.date || invoice.issue_date || invoice.due_date || invoice.created_at
  );

  const handlePrint = () => {
    printReceiptElement("printable-receipt");
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={`Receipt & Statement — #${formattedInvoiceNo}`}
      maxWidth="md"
      footer={
        <div className="flex w-full items-center justify-between no-print">
          <div className="flex items-center gap-2">
            {/* Admin offline payment recording */}
            {!isSettled && !isVoided && onRecordPayment && (
              <Button size="sm" onClick={() => onRecordPayment(invoice)}>
                <Wallet className="h-4 w-4" /> Record Payment
              </Button>
            )}

            {/* Tenant GCash payment trigger */}
            {!isSettled && !isVoided && onPayGCash && (
              <Button size="sm" onClick={() => onPayGCash(invoice)}>
                <QrCode className="h-4 w-4" /> Pay via GCash
              </Button>
            )}

            {/* Print / Save PDF Receipt */}
            <Button variant="secondary" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4" /> Print Receipt
            </Button>
          </div>

          <Button size="sm" variant="ghost" onClick={onClose}>
            Done
          </Button>
        </div>
      }
    >
      <ReceiptCard invoice={invoice} />
    </Modal>
  );
}
