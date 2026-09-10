import { useCallback, useEffect, useState } from "react";
import { CheckCircle, XCircle, Plus, Eye, Printer, ShieldCheck, RefreshCw, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { SectionHeader } from "@/components/common/section-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
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
import { getErrorMessage } from "@/lib/errors";
import type { Bill } from "@/lib/types";

function fmtMoney(n: number) {
  return `₱${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function AdminBilling() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Bill | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadBills = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await billingService.getBills({ per_page: 200 });
      setBills(res.data);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load invoices."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBills();
  }, [loadBills]);

  const pendingPayments = bills.filter((b) => b.status === "pending_verification");

  const handleGenerateBills = async () => {
    setGenerating(true);
    setError("");
    setMessage("");
    try {
      const res = await billingService.generateBills();
      setMessage(res.message);
      await loadBills();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to generate bills."));
    } finally {
      setGenerating(false);
    }
  };

  const runVerify = async (id: string, approved: boolean) => {
    setBusyId(id);
    setError("");
    setMessage("");
    try {
      const resMsg = await billingService.verifyPayment(id, {
        approved,
        reject_reason: approved
          ? undefined
          : "Payment rejected by the property manager.",
      });
      setMessage(resMsg);
      await loadBills();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to verify payment."));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Billing & Invoices"
        subtitle="Batch generate monthly invoices and verify tenant GCash payments"
        action={
          <Button onClick={handleGenerateBills} loading={generating}>
            {!generating && (
              <>
                <Plus className="h-4 w-4" />
                Generate Monthly Bills
              </>
            )}
          </Button>
        }
      />

      {message && (
        <div
          className="flex animate-fade-in-up items-center gap-2 rounded-xl border border-success-border bg-success-bg p-4 text-sm font-semibold text-success-fg"
          role="status"
        >
          <CheckCircle className="h-5 w-5" />
          {message}
        </div>
      )}

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

      {/* Pending GCash Verifications */}
      <div className="space-y-4">
        <SectionHeader
          dot
          dotClassName="text-accent"
          icon={<ShieldCheck className="h-5 w-5" />}
          title={`Pending GCash Payment Verifications (${pendingPayments.length})`}
          subtitle="Payment receipts that need to be confirmed"
        />

        {loading ? (
          <SkeletonRows rows={3} />
        ) : pendingPayments.length === 0 ? (
          <Card className="p-0">
            <EmptyState
              title="No payments to verify"
              description="All submitted GCash payments have been reviewed."
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingPayments.map((p) => (
              <Card key={p.id} className="p-5 border-accent-border">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-fg">
                      {p.tenant_name} (Room {p.room})
                    </h3>
                    <p className="mt-1 text-xl font-extrabold text-accent tabular-nums">
                      {fmtMoney(p.total_amount)}
                    </p>
                    {p.gcash_ref && (
                      <p className="mt-2 inline-block rounded-lg border border-edge bg-card px-2 py-1 font-mono text-xs text-muted">
                        Ref: {p.gcash_ref}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <Badge variant="info" dot>Verification Queued</Badge>
                    <span className="text-[11px] text-muted">{p.date}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-accent-border/40 pt-3">
                  <Button
                    size="sm"
                    className="flex-1"
                    loading={busyId === p.id}
                    onClick={() => runVerify(p.id, true)}
                  >
                    {busyId !== p.id && (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Approve Payment
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={busyId === p.id}
                    onClick={() => runVerify(p.id, false)}
                    className="text-danger-fg hover:bg-danger-bg hover:border-danger-border hover:text-danger-fg"
                  >
                    {busyId !== p.id && (
                      <>
                        <XCircle className="h-4 w-4" />
                        Reject
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* All Invoices Table */}
      <div className="space-y-4">
        <SectionHeader
          title="All Monthly Invoices"
          subtitle={`${bills.length} invoices`}
        />

        <Card className="p-0 overflow-hidden">
          {loading ? (
            <div className="p-5">
              <SkeletonRows rows={5} />
            </div>
          ) : bills.length === 0 ? (
            <EmptyState
              title="No invoices yet"
              description="Generate monthly bills to get started."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice ID</TableHead>
                    <TableHead>Tenant & Room</TableHead>
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
                  {bills.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono font-bold text-fg-soft whitespace-nowrap">
                        {inv.id}
                      </TableCell>
                      <TableCell>
                        <p className="font-bold text-fg">{inv.tenant_name}</p>
                        <p className="text-xs text-muted">Room {inv.room}</p>
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold text-muted tabular-nums">
                        {fmtMoney(inv.rent)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold text-muted tabular-nums">
                        {fmtMoney(inv.electricity)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold text-muted tabular-nums">
                        {fmtMoney(inv.water)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-fg tabular-nums whitespace-nowrap">
                        {fmtMoney(inv.total_amount)}
                      </TableCell>
                      <TableCell className="text-xs text-muted whitespace-nowrap">
                        {inv.due_date}
                      </TableCell>
                      <TableCell>
                        <Badge
                          dot
                          variant={
                            inv.status === "paid"
                              ? "success"
                              : inv.status === "pending_verification"
                              ? "warning"
                              : "danger"
                          }
                        >
                          {inv.status === "pending_verification" ? "Pending" : inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedInvoice(inv)}
                          className="text-accent hover:text-accent-strong"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>

      {/* Invoice Detail / Printable Modal */}
      {selectedInvoice && (
        <Modal
          open={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={`Statement of Account: ${selectedInvoice.id}`}
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> Print Statement
              </Button>
              <Button size="sm" onClick={() => setSelectedInvoice(null)}>
                Done
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-sm">
            <div className="flex justify-between border-b border-edge pb-3">
              <div>
                <p className="text-xs text-muted">Resident</p>
                <p className="font-bold text-fg">{selectedInvoice.tenant_name}</p>
                <p className="text-xs text-muted">Room {selectedInvoice.room}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted">Due Date</p>
                <p className="font-bold text-fg">{selectedInvoice.due_date}</p>
              </div>
            </div>

            <div className="space-y-2 py-2">
              <div className="flex justify-between text-xs text-muted">
                <span>Room Rent</span>
                <span className="tabular-nums">{fmtMoney(selectedInvoice.rent)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted">
                <span>Electricity</span>
                <span className="tabular-nums">{fmtMoney(selectedInvoice.electricity)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted">
                <span>Water</span>
                <span className="tabular-nums">{fmtMoney(selectedInvoice.water)}</span>
              </div>
              {selectedInvoice.late_fee > 0 && (
                <div className="flex justify-between text-xs text-danger-fg">
                  <span>Late Fee</span>
                  <span className="tabular-nums">{fmtMoney(selectedInvoice.late_fee)}</span>
                </div>
              )}
              <div className="mt-2 flex justify-between border-t border-edge pt-2 text-base font-bold text-fg">
                <span>Total Due</span>
                <span className="text-accent tabular-nums">
                  {fmtMoney(selectedInvoice.total_amount)}
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}