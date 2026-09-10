import { useState } from "react";
import type { CSSProperties } from "react";
import { CheckCircle2, Eye, Receipt } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { SkeletonRows } from "@/components/ui/skeleton";
import { useFakeLoading } from "@/lib/hooks";

export default function TenantBilling() {
  const loading = useFakeLoading();
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [gcashRef, setGcashRef] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const [bills, setBills] = useState([
    {
      id: "INV-2026-091",
      rent: 5000,
      electricity: 1250,
      water: 500,
      lateFee: 0,
      totalAmount: 6750,
      dueDate: "2026-09-15",
      status: "unpaid",
    },
    {
      id: "INV-2026-081",
      rent: 5000,
      electricity: 1180,
      water: 500,
      lateFee: 0,
      totalAmount: 6680,
      dueDate: "2026-08-15",
      status: "paid",
    },
  ]);

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBills(
      bills.map((b) =>
        b.id === selectedInvoice.id ? { ...b, status: "pending_verification" } : b
      )
    );
    setPaymentSuccess(true);
    setTimeout(() => {
      setPaymentSuccess(false);
      setShowPaymentModal(false);
      setSelectedInvoice(null);
    }, 1800);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Billing & Invoices"
        subtitle="View breakdown of room rent, electricity consumption, and pay via GCash"
      />

      {/* Invoices List */}
      <Card className="p-0 overflow-hidden animate-fade-in-up stagger" style={{ "--i": 0 } as CSSProperties}>
        {loading ? (
          <div className="p-5">
            <SkeletonRows rows={4} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice No.</TableHead>
                  <TableHead className="text-right">Rent</TableHead>
                  <TableHead className="text-right">Electricity</TableHead>
                  <TableHead className="text-right">Water</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <EmptyState
                        title="No invoices yet"
                        description="Your monthly invoice will appear here once it is generated."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  bills.map((bill, i) => (
                    <TableRow key={bill.id} index={i}>
                      <TableCell className="font-mono font-bold text-fg-soft whitespace-nowrap">
                        {bill.id}
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold text-muted tabular-nums">
                        ₱{bill.rent.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold text-muted tabular-nums">
                        ₱{bill.electricity.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold text-muted tabular-nums">
                        ₱{bill.water.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-fg tabular-nums whitespace-nowrap">
                        ₱{bill.totalAmount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-xs text-muted whitespace-nowrap">
                        {bill.dueDate}
                      </TableCell>
                      <TableCell>
                        <Badge
                          dot
                          variant={
                            bill.status === "paid"
                              ? "success"
                              : bill.status === "pending_verification"
                              ? "warning"
                              : "danger"
                          }
                        >
                          {bill.status === "pending_verification" ? "Pending Approval" : bill.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {bill.status === "unpaid" ? (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedInvoice(bill);
                              setShowPaymentModal(true);
                            }}
                          >
                            Pay GCash
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedInvoice(bill)}
                            className="text-accent hover:text-accent-strong"
                          >
                            <Eye className="h-4 w-4" /> View
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* GCash Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <Modal
          open={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          title={`Pay Invoice ${selectedInvoice.id}`}
          footer={
            !paymentSuccess ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowPaymentModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" form="payment-form">
                  Submit Verification
                </Button>
              </>
            ) : undefined
          }
        >
          {paymentSuccess ? (
            <div className="space-y-3 py-6 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-success-fg" />
              <h3 className="text-lg font-bold text-fg">Payment Submitted!</h3>
              <p className="text-xs text-muted">
                Your payment reference has been recorded and submitted to management for verification.
              </p>
            </div>
          ) : (
            <form id="payment-form" onSubmit={handlePaymentSubmit} className="space-y-4">
              <div className="rounded-2xl border border-accent-border bg-accent-soft text-center p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-accent">Total Due</p>
                <p className="mt-1 text-3xl font-extrabold text-fg tabular-nums">
                  ₱{selectedInvoice.totalAmount.toFixed(2)}
                </p>
              </div>

              <div className="space-y-1.5 rounded-xl border border-edge bg-inset p-4 text-xs">
                <p className="font-bold text-fg">GCash Account Name: ARIRENT PROPERTY MANAGEMENT</p>
                <p className="font-bold text-fg">GCash Number: 0917-888-9999</p>
                <p className="pt-1 text-muted">
                  Please send the exact amount to the number above, then enter your transaction reference number below.
                </p>
              </div>

              <Input
                id="ref"
                label="GCash Reference No."
                placeholder="e.g. 1002 9938 1827"
                value={gcashRef}
                onChange={(e) => setGcashRef(e.target.value)}
                required
                autoFocus
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-muted">
                  Upload Receipt Screenshot (Optional)
                </label>
                <div className="cursor-pointer rounded-xl border-2 border-dashed border-edge-strong p-4 text-center transition-all duration-200 hover:border-accent hover:bg-accent-soft/40">
                  <Receipt className="mx-auto mb-1 h-6 w-6 text-muted" />
                  <p className="text-xs text-muted">Click or drag image of GCash receipt</p>
                </div>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}