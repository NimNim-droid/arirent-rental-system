import { Eye, Trash2, Wallet } from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonRows } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { Bill } from "@/lib/types";

interface BillingBillsTableProps {
  bills: Bill[];
  totalRecords: number;
  loading: boolean;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onViewInvoice: (bill: Bill) => void;
  onRecordPayment: (bill: Bill) => void;
  onVoidBill: (bill: Bill) => void;
}

const BILL_STATUS: Record<
  Bill["status"],
  { label: string; variant: BadgeProps["variant"] }
> = {
  paid: { label: "Paid", variant: "success" },
  unpaid: { label: "Unpaid", variant: "danger" },
  partially_paid: { label: "Partial", variant: "warning" },
  pending_verification: { label: "Pending", variant: "warning" },
  overdue: { label: "Overdue", variant: "danger" },
  voided: { label: "Cancelled", variant: "neutral" },
};

export function BillingBillsTable({
  bills,
  totalRecords,
  loading,
  page,
  pageSize,
  totalPages,
  onPageChange,
  onViewInvoice,
  onRecordPayment,
  onVoidBill,
}: BillingBillsTableProps) {
  return (
    <Card className="p-0 overflow-hidden shadow-sm border-edge">
      {loading ? (
        <div className="p-5">
          <SkeletonRows rows={5} />
        </div>
      ) : bills.length === 0 ? (
        <EmptyState
          title="No bills found"
          description="No bills match your current filters. Click 'Generate Bills' to create the monthly billing cycle or 'Add Charge' for incidental items."
        />
      ) : (
        <div className="table-scroll-wrap">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Rent</TableHead>
                <TableHead className="text-right">Utilities</TableHead>
                <TableHead className="text-right">Charges</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.map((bill) => {
                const paid = bill.paid_amount ?? 0;
                const remaining = bill.remaining_balance ?? Math.max(0, bill.total_amount - paid);
                const isSettled = bill.status === "paid" || remaining <= 0;

                const utilitiesSum = Number(bill.electricity || 0) + Number(bill.water || 0);
                const excessSum = (bill.excess_charges || []).reduce(
                  (sum, c) => sum + Number(c.amount || 0),
                  0
                );
                const otherChargesSum = Number(bill.late_fee || 0) + excessSum;

                const tenantName = bill.tenant_name || bill.tenant?.name || "Resident";
                const propName = bill.property_name || bill.tenant?.property?.name || "AriRent";
                const roomName = bill.room || bill.tenant?.room || "—";
                const statusMeta = BILL_STATUS[bill.status] ?? {
                  label: bill.status,
                  variant: "neutral" as const,
                };

                return (
                  <TableRow key={bill.id}>
                    <TableCell className="font-medium text-fg whitespace-nowrap">
                      {tenantName}
                    </TableCell>

                    <TableCell className="text-muted whitespace-nowrap">
                      <span className="font-medium text-fg">Room {roomName}</span>{" "}
                      <span className="text-xs text-muted">· {propName}</span>
                    </TableCell>

                    <TableCell className="text-right tabular-nums text-fg whitespace-nowrap">
                      {formatCurrency(bill.rent)}
                    </TableCell>

                    <TableCell className="text-right tabular-nums text-fg whitespace-nowrap">
                      {formatCurrency(utilitiesSum)}
                    </TableCell>

                    <TableCell className="text-right tabular-nums text-muted whitespace-nowrap">
                      {otherChargesSum > 0 ? formatCurrency(otherChargesSum) : "—"}
                    </TableCell>

                    <TableCell className="text-right tabular-nums font-semibold text-fg whitespace-nowrap">
                      {formatCurrency(bill.total_amount)}
                    </TableCell>

                    <TableCell className="whitespace-nowrap text-muted">
                      {formatDate(bill.due_date)}
                    </TableCell>

                    <TableCell className="whitespace-nowrap">
                      <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                    </TableCell>

                    <TableCell className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewInvoice(bill)}
                          className="h-8 text-xs text-accent hover:text-accent-strong"
                          title="View Bill Details"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View
                        </Button>

                        {!isSettled && bill.status !== "voided" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onRecordPayment(bill)}
                            className="h-8 text-xs font-medium"
                            title="Record Cash Payment"
                          >
                            <Wallet className="h-3.5 w-3.5 mr-1 text-accent" />
                            Pay
                          </Button>
                        )}

                        {bill.status !== "paid" && bill.status !== "voided" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onVoidBill(bill)}
                            className="h-8 text-xs text-danger-fg hover:bg-danger/10 hover:text-danger-fg"
                            title="Cancel Bill"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Cancel
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

      {/* Table Footer with Pagination Controls */}
      {totalRecords > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-edge bg-card/60 text-xs text-muted">
          <div>
            Showing <span className="font-semibold text-fg font-mono">{(page - 1) * pageSize + 1}</span> to{" "}
            <span className="font-semibold text-fg font-mono">{Math.min(page * pageSize, totalRecords)}</span> of{" "}
            <span className="font-semibold text-fg font-mono">{totalRecords}</span> records
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => onPageChange(Math.max(1, page - 1))}
                className="h-7 px-2.5 text-xs font-medium"
              >
                Previous
              </Button>
              <span className="px-2 font-mono text-xs font-semibold text-fg">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                className="h-7 px-2.5 text-xs font-medium"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

