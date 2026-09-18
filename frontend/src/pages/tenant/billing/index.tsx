import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, RefreshCw, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { settingsService } from "@/lib/services/settings";
import { getErrorMessage } from "@/lib/errors";
import { formatCurrency } from "@/lib/formatters";
import {
  BillingStats,
  GCashPaymentModal,
  TenantStatementModal,
} from "@/components/features/billing";
import type { Bill, Settings } from "@/lib/types";

export default function TenantBilling() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Bill | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBills = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const billsRes = await billingService.getBills({ per_page: 100 });
      setBills(billsRes.data);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load your invoices."));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    if (settings) return;
    try {
      const s = await settingsService.getSettings();
      setSettings(s);
    } catch {
      // Handled gracefully
    }
  }, [settings]);

  useEffect(() => {
    loadBills();
    loadSettings();
  }, [loadBills, loadSettings]);

  const openPayment = (bill: Bill) => {
    setSelectedInvoice(bill);
    setShowPaymentModal(true);
  };

  const openStatement = (bill: Bill) => {
    setSelectedInvoice(bill);
    setShowStatementModal(true);
  };

  const unpaidBills = useMemo(
    () => bills.filter((b) => b.status === "unpaid"),
    [bills]
  );
  const unpaidTotal = useMemo(
    () => unpaidBills.reduce((sum, b) => sum + b.total_amount, 0),
    [unpaidBills]
  );

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

      {/* Outstanding balance banner */}
      {!loading && (
        <BillingStats
          unpaidTotal={unpaidTotal}
          unpaidCount={unpaidBills.length}
        />
      )}

      {/* Invoices List */}
      <Card className="p-0 overflow-hidden">
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
          <div className="table-scroll-wrap">
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
                {bills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell className="font-mono font-bold text-fg-soft whitespace-nowrap">
                      {bill.id}
                    </TableCell>
                    <TableCell className="text-right text-xs font-semibold text-muted tabular-nums">
                      {formatCurrency(bill.rent)}
                    </TableCell>
                    <TableCell className="text-right text-xs font-semibold text-muted tabular-nums">
                      {formatCurrency(bill.electricity)}
                    </TableCell>
                    <TableCell className="text-right text-xs font-semibold text-muted tabular-nums">
                      {formatCurrency(bill.water)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-fg tabular-nums whitespace-nowrap">
                      {formatCurrency(bill.total_amount)}
                    </TableCell>
                    <TableCell className="text-xs text-muted whitespace-nowrap">
                      {bill.due_date}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge
                          dot
                          variant={
                            bill.status === "paid"
                              ? "success"
                              : bill.status === "pending_verification"
                              ? "warning"
                              : bill.status === "voided"
                              ? "neutral"
                              : "danger"
                          }
                        >
                          {bill.status === "pending_verification"
                            ? "Pending Approval"
                            : bill.status === "voided"
                            ? "Voided"
                            : bill.status}
                        </Badge>
                        {bill.status === "unpaid" && bill.reject_reason && (
                          <p className="text-[10px] text-danger-fg font-semibold flex items-center gap-1" title={bill.reject_reason}>
                            <AlertTriangle className="h-3 w-3 shrink-0" />
                            Rejected
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openStatement(bill)}
                          className="text-accent hover:text-accent-strong"
                        >
                          <Eye className="h-4 w-4" /> View
                        </Button>
                        {bill.status === "unpaid" && (
                          <Button size="sm" onClick={() => openPayment(bill)}>
                            Pay GCash
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* GCash Payment Modal */}
      <GCashPaymentModal
        open={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
        settings={settings}
        onPaymentSuccess={loadBills}
      />

      {/* Invoice Statement Modal */}
      <TenantStatementModal
        open={showStatementModal}
        onClose={() => {
          setShowStatementModal(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
        onPayGCash={openPayment}
      />
    </div>
  );
}