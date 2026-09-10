import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { CheckCircle, Eye, Receipt, RefreshCw, AlertTriangle } from "lucide-react";
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
import { billingService } from "@/lib/services/billing";
import { dashboardService } from "@/lib/services/dashboard";
import { getErrorMessage } from "@/lib/errors";
import type { Bill, Settings } from "@/lib/types";

function fmtMoney(n: number) {
  return `₱${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function TenantBilling() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Bill | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [gcashRef, setGcashRef] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMsg, setPaymentMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBills = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [billsRes, dash] = await Promise.all([
        billingService.getBills({ per_page: 100 }),
        dashboardService.getTenantDashboard(),
      ]);
      setBills(billsRes.data);
      setSettings(dash.settings ?? null);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load your invoices."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBills();
  }, [loadBills]);

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setSubmitting(true);
    setError("");
    try {
      const msg = await billingService.submitPayment(selectedInvoice.id, {
        gcash_ref: gcashRef,
        receipt: receipt || undefined,
      });
      setPaymentMsg(msg);
      await loadBills();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to submit your payment."));
    } finally {
      setSubmitting(false);
    }
  };

  const openPayment = (bill: Bill) => {
    setSelectedInvoice(bill);
    setGcashRef("");
    setReceipt(null);
    setPaymentMsg("");
    setShowPaymentModal(true);
  };

  const openStatement = (bill: Bill) => {
    setSelectedInvoice(bill);
    setShowStatementModal(true);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Billing & Invoices"
        subtitle="View breakdown of room rent, electricity consumption, and pay via GCash"
      />

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-xs font-semibold text-danger-fg">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </span>
          <Button variant="ghost" size="sm" onClick={loadBills}>
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      )}

      {/* Invoices List */}
      <Card className="p-0 overflow-hidden animate-fade-in-up stagger" style={{ "--i": 0 } as CSSProperties}>
        {loading ? (
          <div className="p-5">
            <SkeletonRows rows={4} />
          </div>
        ) : bills.length === 0 ? (
          <EmptyState
            title="No invoices yet"
            description="Your monthly invoice will appear here once it is generated."
          />
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
                {bills.map((bill, i) => (
                  <TableRow key={bill.id} index={i}>
                    <TableCell className="font-mono font-bold text-fg-soft whitespace-nowrap">
                      {bill.id}
                    </TableCell>
                    <TableCell className="text-right text-xs font-semibold text-muted tabular-nums">
                      {fmtMoney(bill.rent)}
                    </TableCell>
                    <TableCell className="text-right text-xs font-semibold text-muted tabular-nums">
                      {fmtMoney(bill.electricity)}
                    </TableCell>
                    <TableCell className="text-right text-xs font-semibold text-muted tabular-nums">
                      {fmtMoney(bill.water)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-fg tabular-nums whitespace-nowrap">
                      {fmtMoney(bill.total_amount)}
                    </TableCell>
                    <TableCell className="text-xs text-muted whitespace-nowrap">
                      {bill.due_date}
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
                        {bill.status === "pending_verification"
                          ? "Pending Approval"
                          : bill.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {bill.status === "unpaid" ? (
                        <Button size="sm" onClick={() => openPayment(bill)}>
                          Pay GCash
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openStatement(bill)}
                          className="text-accent hover:text-accent-strong"
                        >
                          <Eye className="h-4 w-4" /> View
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* GCash Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <Modal
          open={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedInvoice(null);
          }}
          title={`Pay Invoice ${selectedInvoice.id}`}
          footer={
            paymentMsg ? (
              <Button type="button" onClick={() => setShowPaymentModal(false)}>
                Done
              </Button>
            ) : (
              <>
                <Button type="button" variant="secondary" onClick={() => setShowPaymentModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" form="payment-form" loading={submitting}>
                  {!submitting && "Submit for Verification"}
                </Button>
              </>
            )
          }
        >
          {paymentMsg ? (
            <div className="space-y-3 py-6 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-success-fg" />
              <h3 className="text-lg font-bold text-fg">Payment Submitted!</h3>
              <p className="text-xs text-muted">{paymentMsg}</p>
            </div>
          ) : (
            <form id="payment-form" onSubmit={handlePaymentSubmit} className="space-y-4">
              <div className="rounded-2xl border border-accent-border bg-accent-soft text-center p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-accent">Total Due</p>
                <p className="mt-1 text-3xl font-extrabold text-fg tabular-nums">
                  {fmtMoney(selectedInvoice.total_amount)}
                </p>
              </div>

              <div className="space-y-1.5 rounded-xl border border-edge bg-inset p-4 text-xs">
                <p className="font-bold text-fg">
                  GCash Account Name: {settings?.gcash_name ?? "—"}
                </p>
                <p className="font-bold text-fg">
                  GCash Number: {settings?.gcash_number ?? "—"}
                </p>
                <p className="pt-1 text-muted">
                  Please send the exact amount to the number above, then enter your transaction
                  reference number below.
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
                <label
                  htmlFor="receipt-upload"
                  className="block cursor-pointer rounded-xl border-2 border-dashed border-edge-strong p-4 text-center transition-all duration-200 hover:border-accent hover:bg-accent-soft/40"
                >
                  <input
                    id="receipt-upload"
                    type="file"
                    accept="image/*,.pdf"
                    className="sr-only"
                    onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
                  />
                  <Receipt className="mx-auto mb-1 h-6 w-6 text-muted" />
                  {receipt ? (
                    <p className="text-xs font-semibold text-fg">{receipt.name}</p>
                  ) : (
                    <p className="text-xs text-muted">Click or drag image of GCash receipt</p>
                  )}
                </label>
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* Invoice Statement Modal */}
      {showStatementModal && selectedInvoice && (
        <Modal
          open={showStatementModal}
          onClose={() => setShowStatementModal(false)}
          title={`Invoice Statement — ${selectedInvoice.id}`}
          footer={
            <>
              <Button type="button" variant="secondary" onClick={() => setShowStatementModal(false)}>
                Close
              </Button>
              {selectedInvoice.status === "unpaid" && (
                <Button
                  type="button"
                  onClick={() => {
                    setShowStatementModal(false);
                    openPayment(selectedInvoice);
                  }}
                >
                  Pay via GCash
                </Button>
              )}
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-edge bg-inset p-3">
                <p className="text-muted">Invoice Number</p>
                <p className="mt-0.5 font-bold text-fg font-mono">{selectedInvoice.id}</p>
              </div>
              <div className="rounded-xl border border-edge bg-inset p-3">
                <p className="text-muted">Due Date</p>
                <p className="mt-0.5 font-bold text-fg">{selectedInvoice.due_date}</p>
              </div>
            </div>

            <div className="space-y-1.5 rounded-2xl border border-edge p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                Billing Breakdown
              </p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Monthly Rent</span>
                <span className="font-semibold text-fg tabular-nums">
                  {fmtMoney(selectedInvoice.rent)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Electricity</span>
                <span className="font-semibold text-fg tabular-nums">
                  {fmtMoney(selectedInvoice.electricity)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Water</span>
                <span className="font-semibold text-fg tabular-nums">
                  {fmtMoney(selectedInvoice.water)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Late Fee</span>
                <span className="font-semibold text-fg tabular-nums">
                  {fmtMoney(selectedInvoice.late_fee)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-edge pt-2 text-sm">
                <span className="font-bold text-fg">Total Amount Due</span>
                <span className="font-extrabold text-fg tabular-nums">
                  {fmtMoney(selectedInvoice.total_amount)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">Payment Status</span>
              <Badge
                dot
                variant={
                  selectedInvoice.status === "paid"
                    ? "success"
                    : selectedInvoice.status === "pending_verification"
                    ? "warning"
                    : "danger"
                }
              >
                {selectedInvoice.status === "pending_verification"
                  ? "Pending Approval"
                  : selectedInvoice.status}
              </Badge>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}