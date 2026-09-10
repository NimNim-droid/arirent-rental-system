import { useState } from "react";
import { CheckCircle, XCircle, Plus, Eye, Printer, ShieldCheck } from "lucide-react";
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
import { useFakeLoading } from "@/lib/hooks";

export default function AdminBilling() {
  const loading = useFakeLoading();
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [generatedMsg, setGeneratedMsg] = useState("");

  const [pendingPayments, setPendingPayments] = useState([
    {
      id: "INV-2026-091",
      tenant: "Carlos Reyes",
      room: "204",
      amount: 6850,
      gcashRef: "GCASH-99281729",
      date: "2026-09-08",
    },
    {
      id: "INV-2026-092",
      tenant: "Angela De Silva",
      room: "201",
      amount: 5500,
      gcashRef: "GCASH-11029384",
      date: "2026-09-07",
    },
  ]);

  const [invoices, setInvoices] = useState([
    {
      id: "INV-2026-001",
      tenant: "Maria Santos",
      room: "101",
      rent: 5000,
      electricity: 1250,
      water: 500,
      lateFee: 0,
      totalAmount: 6750,
      dueDate: "2026-09-15",
      status: "paid",
    },
    {
      id: "INV-2026-002",
      tenant: "Carlos Reyes",
      room: "204",
      rent: 5000,
      electricity: 1350,
      water: 500,
      lateFee: 0,
      totalAmount: 6850,
      dueDate: "2026-09-15",
      status: "pending_verification",
    },
    {
      id: "INV-2026-003",
      tenant: "Elena Gomez",
      room: "302",
      rent: 6000,
      electricity: 1100,
      water: 600,
      lateFee: 250,
      totalAmount: 7950,
      dueDate: "2026-09-15",
      status: "unpaid",
    },
  ]);

  const handleGenerateBills = () => {
    setGeneratedMsg("12 monthly invoices generated successfully!");
    setTimeout(() => setGeneratedMsg(""), 4000);
  };

  const handleApprovePayment = (id: string) => {
    setPendingPayments(pendingPayments.filter((p) => p.id !== id));
    setInvoices(
      invoices.map((inv) => (inv.id === id ? { ...inv, status: "paid" } : inv))
    );
  };

  const handleRejectPayment = (id: string) => {
    setPendingPayments(pendingPayments.filter((p) => p.id !== id));
    setInvoices(
      invoices.map((inv) => (inv.id === id ? { ...inv, status: "unpaid" } : inv))
    );
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Billing & Invoices"
        subtitle="Batch generate monthly invoices and verify tenant GCash payments"
        action={
          <Button onClick={handleGenerateBills}>
            <Plus className="h-4 w-4" />
            Generate Monthly Bills
          </Button>
        }
      />

      {generatedMsg && (
        <div
          className="flex animate-fade-in-up items-center gap-2 rounded-xl border border-success-border bg-success-bg p-4 text-sm font-semibold text-success-fg"
          role="status"
        >
          <CheckCircle className="h-5 w-5" />
          {generatedMsg}
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
                    <h3 className="font-bold text-fg">{p.tenant} (Room {p.room})</h3>
                    <p className="mt-1 text-xl font-extrabold text-accent tabular-nums">
                      ₱{p.amount.toLocaleString()}
                    </p>
                    <p className="mt-2 inline-block rounded-lg border border-edge bg-card px-2 py-1 font-mono text-xs text-muted">
                      Ref: {p.gcashRef}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <Badge variant="info" dot>Verification Queued</Badge>
                    <span className="text-[11px] text-muted">{p.date}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-accent-border/40 pt-3">
                  <Button size="sm" onClick={() => handleApprovePayment(p.id)} className="flex-1">
                    <CheckCircle className="h-4 w-4" />
                    Approve Payment
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleRejectPayment(p.id)}
                    className="text-danger-fg hover:bg-danger-bg hover:border-danger-border hover:text-danger-fg"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
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
          subtitle={`${invoices.length} invoices for September 2026`}
        />

        <Card className="p-0 overflow-hidden">
          {loading ? (
            <div className="p-5">
              <SkeletonRows rows={5} />
            </div>
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
                  {invoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9}>
                        <EmptyState
                          title="No invoices yet"
                          description="Generate monthly bills to get started."
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    invoices.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-mono font-bold text-fg-soft whitespace-nowrap">
                          {inv.id}
                        </TableCell>
                        <TableCell>
                          <p className="font-bold text-fg">{inv.tenant}</p>
                          <p className="text-xs text-muted">Room {inv.room}</p>
                        </TableCell>
                        <TableCell className="text-right text-xs font-semibold text-muted tabular-nums">
                          ₱{inv.rent.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-xs font-semibold text-muted tabular-nums">
                          ₱{inv.electricity.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-xs font-semibold text-muted tabular-nums">
                          ₱{inv.water.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-bold text-fg tabular-nums whitespace-nowrap">
                          ₱{inv.totalAmount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs text-muted whitespace-nowrap">
                          {inv.dueDate}
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
                    ))
                  )}
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
                <p className="font-bold text-fg">{selectedInvoice.tenant}</p>
                <p className="text-xs text-muted">Room {selectedInvoice.room}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted">Due Date</p>
                <p className="font-bold text-fg">{selectedInvoice.dueDate}</p>
              </div>
            </div>

            <div className="space-y-2 py-2">
              <div className="flex justify-between text-xs text-muted">
                <span>Room Rent</span>
                <span className="tabular-nums">₱{selectedInvoice.rent.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted">
                <span>Electricity</span>
                <span className="tabular-nums">₱{selectedInvoice.electricity.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted">
                <span>Water</span>
                <span className="tabular-nums">₱{selectedInvoice.water.toFixed(2)}</span>
              </div>
              {selectedInvoice.lateFee > 0 && (
                <div className="flex justify-between text-xs text-danger-fg">
                  <span>Late Fee</span>
                  <span className="tabular-nums">₱{selectedInvoice.lateFee.toFixed(2)}</span>
                </div>
              )}
              <div className="mt-2 flex justify-between border-t border-edge pt-2 text-base font-bold text-fg">
                <span>Total Due</span>
                <span className="text-accent tabular-nums">
                  ₱{selectedInvoice.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}