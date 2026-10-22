import { Eye, Trash2, Wallet } from "lucide-react";
import { SectionHeader } from "@/components/common/section-header";
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
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate, formatInvoiceNumber } from "@/lib/formatters";
import type { Bill } from "@/lib/types";

interface InvoiceTableProps {
  bills: Bill[];
  loading: boolean;
  busyId: string | null;
  onView: (bill: Bill) => void;
  onVoid: (id: string) => void;
  onRecordPayment?: (bill: Bill) => void;
}

export function InvoiceTable({
  bills,
  loading,
  busyId,
  onView,
  onVoid,
  onRecordPayment,
}: InvoiceTableProps) {
  const getBadgeVariant = (status: Bill["status"]) => {
    switch (status) {
      case "paid":
        return "success";
      case "partially_paid":
        return "warning";
      case "pending_verification":
        return "warning";
      case "voided":
        return "neutral";
      default:
        return "danger";
    }
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        title="All Monthly Invoices"
        subtitle={loading ? "Loading invoices..." : `${bills.length} invoices recorded`}
      />

      <Card className="p-0 overflow-hidden">
        {!loading && bills.length === 0 ? (
          <EmptyState
            title="No invoices yet"
            description="Generate monthly bills or create one manually to get started."
          />
        ) : (
          <div className="table-scroll-wrap">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Property / Unit</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-28" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="h-4 w-16 ml-auto" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-16" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="h-8 w-24 ml-auto" />
                        </TableCell>
                      </TableRow>
                    ))
                  : bills.map((inv) => {
                      const paid = inv.paid_amount ?? 0;
                      const remaining = inv.remaining_balance ?? Math.max(0, inv.total_amount - paid);
                      const isSettled = inv.status === "paid" || remaining <= 0;
                      const propName = inv.property_name || inv.tenant?.property?.name || "AriRent";
                      const unitNumber = inv.room || inv.tenant?.room || "—";

                      return (
                        <TableRow key={inv.id}>
                          <TableCell className="font-mono font-bold text-fg-soft text-xs whitespace-nowrap">
                            {formatInvoiceNumber(inv.id, inv.created_at || inv.due_date)}
                          </TableCell>
                          <TableCell>
                            <p className="font-bold text-fg text-sm">{inv.tenant_name || inv.tenant?.name || "Resident"}</p>
                          </TableCell>
                          <TableCell className="text-xs text-muted whitespace-nowrap">
                            {propName} / Unit {unitNumber}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-fg tabular-nums whitespace-nowrap">
                            <div>
                              <span>{formatCurrency(inv.total_amount)}</span>
                              {inv.status === "partially_paid" && (
                                <p className="text-[10px] text-accent font-medium">
                                  Bal: {formatCurrency(remaining)}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted whitespace-nowrap">
                            {formatDate(inv.created_at || inv.due_date)}
                          </TableCell>
                          <TableCell className="text-xs text-muted whitespace-nowrap">
                            {formatDate(inv.due_date)}
                          </TableCell>
                          <TableCell>
                            <Badge dot variant={getBadgeVariant(inv.status)}>
                              {inv.status === "partially_paid"
                                ? "Partially Paid"
                                : inv.status === "pending_verification"
                                ? "Pending Approval"
                                : inv.status === "paid"
                                ? "Paid"
                                : inv.status === "voided"
                                ? "Cancelled"
                                : "Unpaid"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {!isSettled && onRecordPayment && inv.status !== "voided" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onRecordPayment(inv)}
                                  className="h-8 text-xs font-medium"
                                  title="Record Cash/Offline Payment"
                                >
                                  <Wallet className="h-3.5 w-3.5 mr-1 text-accent" />
                                  Record Cash
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onView(inv)}
                                className="h-8 text-xs text-accent hover:text-accent-strong"
                              >
                                <Eye className="h-3.5 w-3.5 mr-1" />
                                View
                              </Button>
                              {inv.status !== "paid" && inv.status !== "voided" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  loading={busyId === inv.id}
                                  onClick={() => onVoid(inv.id)}
                                  className="h-8 text-xs text-danger-fg hover:text-danger-fg hover:bg-danger-bg"
                                  title="Cancel Bill"
                                >
                                  {busyId !== inv.id && (
                                    <>
                                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                                      Cancel
                                    </>
                                  )}
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
    </div>
  );
}
