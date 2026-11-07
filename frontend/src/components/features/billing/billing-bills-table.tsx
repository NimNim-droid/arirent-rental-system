import { Eye, Trash2, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
                <TableHead>Property / Unit</TableHead>
                <TableHead className="text-right">Rent</TableHead>
                <TableHead className="text-right">Utilities</TableHead>
                <TableHead className="text-right">Other Charges</TableHead>
                <TableHead className="text-right font-bold">Total Amount</TableHead>
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
                const otherChargesSum = (bill.excess_charges || []).reduce(
                  (sum, c) => sum + Number(c.amount || 0),
                  0
                );

                const tenantName = bill.tenant_name || bill.tenant?.name || "Resident";
                const propName = bill.property_name || bill.tenant?.property?.name || "AriRent Property";
                const roomName = bill.room || bill.tenant?.room || "—";

                return (
                  <TableRow key={bill.id}>
                    {/* Tenant */}
                    <TableCell>
                      <p className="font-bold text-fg text-xs">{tenantName}</p>
                      <p className="text-[11px] text-muted">ID: #{bill.id}</p>
                    </TableCell>

                    {/* Property / Unit */}
                    <TableCell>
                      <p className="text-xs font-semibold text-fg">{propName}</p>
                      <p className="text-[11px] text-muted">Room {roomName}</p>
                    </TableCell>

                    {/* Rent */}
                    <TableCell className="text-right tabular-nums text-xs font-semibold text-fg whitespace-nowrap">
                      {formatCurrency(bill.rent)}
                    </TableCell>

                    {/* Utilities */}
                    <TableCell className="text-right tabular-nums whitespace-nowrap">
                      <p className="text-xs font-semibold text-fg">
                        {formatCurrency(utilitiesSum)}
                      </p>
                      <p className="text-[10px] text-muted">
                        ⚡ {formatCurrency(bill.electricity)} • 💧 {formatCurrency(bill.water)}
                      </p>
                    </TableCell>

                    {/* Other Charges */}
                    <TableCell className="text-right tabular-nums whitespace-nowrap">
                      <p className="text-xs font-semibold text-fg">
                        {formatCurrency(otherChargesSum)}
                      </p>
                      {bill.excess_charges && bill.excess_charges.length > 0 && (
                        <span className="inline-block rounded bg-accent/10 px-1.5 py-0.2 text-[10px] font-semibold text-accent">
                          {bill.excess_charges.length} item{bill.excess_charges.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </TableCell>

                    {/* Total Amount */}
                    <TableCell className="text-right tabular-nums whitespace-nowrap font-medium text-[13px] text-fg">
                      {formatCurrency(bill.total_amount)}
                    </TableCell>

                    {/* Due Date */}
                    <TableCell className="whitespace-nowrap text-xs text-muted">
                      {formatDate(bill.due_date)}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
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
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewInvoice(bill)}
                          className="h-8 text-xs text-accent hover:text-accent-strong"
                          title="View Invoice Statement"
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
                            title="Record Cash or Offline Payment Received"
                          >
                            <Wallet className="h-3.5 w-3.5 mr-1 text-accent" />
                            Record Cash
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

