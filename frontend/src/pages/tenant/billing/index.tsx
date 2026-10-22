import { Eye, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertBanner } from "@/components/ui/alert-banner";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { SkeletonRows } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/formatters";
import {
  useTenantBilling,
  BillingStats,
  GCashPaymentModal,
  TenantStatementModal,
} from "@/components/features/billing";

export default function TenantBilling() {
  const {
    bills,
    settings,
    selectedInvoice,
    showPaymentModal,
    showStatementModal,
    loading,
    error,
    unpaidBills,
    unpaidTotal,
    loadBills,
    openPayment,
    openStatement,
    closePaymentModal,
    closeStatementModal,
  } = useTenantBilling();

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Billing & Invoices"
        subtitle="View breakdown of room rent, electricity consumption, and pay via GCash"
      />

      {error && <AlertBanner variant="danger" message={error} onRetry={loadBills} />}

      {/* Outstanding balance banner */}
      {!loading && (
        <BillingStats
          unpaidTotal={unpaidTotal}
          unpaidCount={unpaidBills.length}
        />
      )}

      {/* Invoices List */}
      <Card className="overflow-hidden p-0">
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
                  <TableHead className="text-right">Total Due</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.map((bill) => {
                  const paid = bill.paid_amount ?? 0;
                  const remaining = bill.remaining_balance ?? Math.max(0, bill.total_amount - paid);
                  const canPay = (bill.status === "unpaid" || bill.status === "partially_paid") && remaining > 0;

                  return (
                    <TableRow key={bill.id}>
                      <TableCell className="whitespace-nowrap font-mono font-bold text-fg-soft">
                        #{bill.id}
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold tabular-nums text-muted">
                        {formatCurrency(bill.rent)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold tabular-nums text-muted">
                        {formatCurrency(bill.electricity)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold tabular-nums text-muted">
                        {formatCurrency(bill.water)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums text-fg">
                        {formatCurrency(bill.total_amount)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right text-xs font-semibold tabular-nums text-success-fg">
                        {formatCurrency(paid)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-bold tabular-nums text-accent">
                        {formatCurrency(remaining)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted">
                        {bill.due_date}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge
                            dot
                            variant={
                              bill.status === "paid"
                                ? "success"
                                : bill.status === "partially_paid"
                                ? "warning"
                                : bill.status === "pending_verification"
                                ? "warning"
                                : bill.status === "voided"
                                ? "neutral"
                                : "danger"
                            }
                          >
                            {bill.status === "partially_paid"
                              ? "Partially Paid"
                              : bill.status === "pending_verification"
                              ? "Pending Approval"
                              : bill.status === "voided"
                              ? "Cancelled"
                              : bill.status}
                          </Badge>
                          {bill.status === "unpaid" && bill.reject_reason && (
                            <p
                              className="flex items-center gap-1 text-[10px] font-semibold text-danger-fg"
                              title={bill.reject_reason}
                            >
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
                          {canPay && (
                            <Button size="sm" onClick={() => openPayment(bill)}>
                              Pay GCash
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* GCash Payment Modal */}
      <GCashPaymentModal
        open={showPaymentModal}
        onClose={closePaymentModal}
        invoice={selectedInvoice}
        settings={settings}
        onPaymentSuccess={loadBills}
      />

      {/* Invoice Statement Modal */}
      <TenantStatementModal
        open={showStatementModal}
        onClose={closeStatementModal}
        invoice={selectedInvoice}
        onPayGCash={openPayment}
      />
    </div>
  );
}