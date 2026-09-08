import { useState } from "react";
import { Receipt, CheckCircle, XCircle, Search, Filter, Plus, Eye, Printer } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export default function AdminBilling() {
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [generatedMsg, setGeneratedMsg] = useState("");

  // Mock pending GCash payments to verify
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

  // Mock all bills
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
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-sm rounded-xl flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          {generatedMsg}
        </div>
      )}

      {/* Pending GCash Verifications */}
      {pendingPayments.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-sky-500 animate-pulse" />
            <h2 className="text-base font-bold text-slate-900">
              Pending GCash Payment Verifications ({pendingPayments.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingPayments.map((p) => (
              <Card key={p.id} className="p-5 border-sky-200 bg-sky-50/30">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900">{p.tenant} (Room {p.room})</h3>
                    <p className="text-xl font-black text-sky-600 mt-1">
                      ₱{p.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-600 mt-2 font-mono bg-white inline-block px-2 py-1 rounded-md border border-slate-200">
                      Ref: {p.gcashRef}
                    </p>
                  </div>
                  <Badge variant="info">Verification Queued</Badge>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-sky-200/50">
                  <Button size="sm" onClick={() => handleApprovePayment(p.id)} className="flex-1">
                    <CheckCircle className="h-4 w-4" />
                    Approve Payment
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleRejectPayment(p.id)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All Invoices Table */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">All Monthly Invoices</h2>

        <Card className="p-0 overflow-hidden border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="p-4">Invoice ID</th>
                  <th className="p-4">Tenant & Room</th>
                  <th className="p-4">Rent</th>
                  <th className="p-4">Electricity</th>
                  <th className="p-4">Water</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Due Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-700">{inv.id}</td>
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{inv.tenant}</p>
                      <p className="text-xs text-slate-400">Room {inv.room}</p>
                    </td>
                    <td className="p-4 text-xs font-semibold text-slate-600">₱{inv.rent.toLocaleString()}</td>
                    <td className="p-4 text-xs font-semibold text-slate-600">₱{inv.electricity.toLocaleString()}</td>
                    <td className="p-4 text-xs font-semibold text-slate-600">₱{inv.water.toLocaleString()}</td>
                    <td className="p-4 font-bold text-slate-900">₱{inv.totalAmount.toLocaleString()}</td>
                    <td className="p-4 text-xs text-slate-500">{inv.dueDate}</td>
                    <td className="p-4">
                      <Badge
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
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedInvoice(inv)}
                        className="text-sky-600 hover:text-sky-700"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Invoice Detail / Printable Modal */}
      {selectedInvoice && (
        <Modal
          open={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={`Statement of Account: ${selectedInvoice.id}`}
        >
          <div className="space-y-4 text-sm">
            <div className="flex justify-between border-b pb-3">
              <div>
                <p className="text-xs text-slate-400">Resident</p>
                <p className="font-bold text-slate-800">{selectedInvoice.tenant}</p>
                <p className="text-xs text-slate-500">Room {selectedInvoice.room}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Due Date</p>
                <p className="font-bold text-slate-800">{selectedInvoice.dueDate}</p>
              </div>
            </div>

            <div className="space-y-2 py-2">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Room Rent</span>
                <span>₱{selectedInvoice.rent.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Electricity</span>
                <span>₱{selectedInvoice.electricity.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Water</span>
                <span>₱{selectedInvoice.water.toFixed(2)}</span>
              </div>
              {selectedInvoice.lateFee > 0 && (
                <div className="flex justify-between text-xs text-red-600">
                  <span>Late Fee</span>
                  <span>₱{selectedInvoice.lateFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base text-slate-900 border-t pt-2 mt-2">
                <span>Total Due</span>
                <span className="text-sky-600">₱{selectedInvoice.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <Button variant="secondary" size="sm" onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> Print Statement
              </Button>
              <Button size="sm" onClick={() => setSelectedInvoice(null)}>
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
