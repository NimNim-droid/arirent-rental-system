import { useState } from "react";
import { QrCode, Upload, CheckCircle2, Eye, Receipt, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";

export default function TenantBilling() {
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
    }, 2000);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Billing & Invoices"
        subtitle="View breakdown of room rent, electricity consumption, and pay via GCash"
      />

      {/* Invoices List */}
      <Card className="p-0 overflow-hidden border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="p-4">Invoice No.</th>
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
              {bills.map((bill) => (
                <tr key={bill.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-mono font-bold text-slate-800">{bill.id}</td>
                  <td className="p-4 text-xs font-semibold text-slate-600">₱{bill.rent.toFixed(2)}</td>
                  <td className="p-4 text-xs font-semibold text-slate-600">₱{bill.electricity.toFixed(2)}</td>
                  <td className="p-4 text-xs font-semibold text-slate-600">₱{bill.water.toFixed(2)}</td>
                  <td className="p-4 font-bold text-slate-900">₱{bill.totalAmount.toFixed(2)}</td>
                  <td className="p-4 text-xs text-slate-500">{bill.dueDate}</td>
                  <td className="p-4">
                    <Badge
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
                  </td>
                  <td className="p-4 text-right">
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
                      >
                        <Eye className="h-4 w-4" /> View
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* GCash Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <Modal
          open={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          title={`Pay Invoice ${selectedInvoice.id}`}
        >
          {paymentSuccess ? (
            <div className="text-center py-6 space-y-3">
              <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
              <h3 className="text-lg font-bold text-slate-900">Payment Submitted!</h3>
              <p className="text-xs text-slate-500">
                Your payment reference has been recorded and submitted to management for verification.
              </p>
            </div>
          ) : (
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100 text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-sky-700">Total Due</p>
                <p className="text-3xl font-black text-sky-900 mt-1">
                  ₱{selectedInvoice.totalAmount.toFixed(2)}
                </p>
              </div>

              {/* GCash Details */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <p className="font-bold text-slate-800">GCash Account Name: ARIRENT PROPERTY MANAGEMENT</p>
                <p className="font-bold text-slate-800">GCash Number: 0917-888-9999</p>
                <p className="text-slate-500 pt-1">
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
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Upload Receipt Screenshot (Optional)
                </label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-sky-500 cursor-pointer transition-colors">
                  <Upload className="h-6 w-6 text-slate-400 mx-auto mb-1" />
                  <p className="text-xs text-slate-500">Click or drag image of GCash receipt</p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowPaymentModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Submit Verification</Button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}
