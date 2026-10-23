import { Eye, Trash2 } from "lucide-react";
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
  totalBills?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  loading: boolean;
  busyId: string | null;
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  onToggleSelectAll?: () => void;
  onView: (bill: Bill) => void;
  onVoid: (id: string) => void;
  onDeleteSingle?: (id: string) => void;
  onRecordPayment?: (bill: Bill) => void;
}

export function InvoiceTable({
  bills,
  totalBills,
  page = 1,
  pageSize = 10,
  onPageChange,
  loading,
  busyId,
  selectedIds = [],
  onToggleSelect,
  onToggleSelectAll,
  onView,
  onVoid,
  onDeleteSingle,
  onRecordPayment,
}: InvoiceTableProps) {
  const totalCount = totalBills ?? bills.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

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

  const allSelected = bills.length > 0 && bills.every((b) => selectedIds.includes(String(b.id)));
  const someSelected = bills.some((b) => selectedIds.includes(String(b.id)));

  return (
    <div className="space-y-4">
      <SectionHeader
        title="All Monthly Invoices"
        subtitle={loading ? "Loading invoices..." : `${totalCount} invoice${totalCount !== 1 ? "s" : ""} recorded`}
      />

      <Card className="p-0 overflow-hidden shadow-sm border-edge">
        {!loading && bills.length === 0 ? (
          <EmptyState
            title="No invoices yet"
            description="Generate monthly bills or adjust filters to view invoice records."
          />
        ) : (
          <div className="table-scroll-wrap">
            <Table>
              <TableHeader>
                <TableRow>
                  {onToggleSelect && (
                    <TableHead className="w-10 px-3 text-center">
                      <input
                        type="checkbox"
                        aria-label="Select all invoices"
                        checked={allSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = someSelected && !allSelected;
                        }}
                        onChange={onToggleSelectAll}
                        className="h-4 w-4 rounded border-edge bg-inset text-accent focus:ring-accent/20 cursor-pointer accent-teal-600 transition-all"
                      />
                    </TableHead>
                  )}
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
                        {onToggleSelect && (
                          <TableCell className="w-10 px-3">
                            <Skeleton className="h-4 w-4 rounded" />
                          </TableCell>
                        )}
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
                      const isSelected = selectedIds.includes(String(inv.id));

                      return (
                        <TableRow
                          key={inv.id}
                          className={isSelected ? "bg-accent/5 border-l-2 border-l-accent" : undefined}
                        >
                          {onToggleSelect && (
                            <TableCell className="w-10 px-3 text-center">
                              <input
                                type="checkbox"
                                aria-label={`Select invoice ${inv.id}`}
                                checked={isSelected}
                                onChange={() => onToggleSelect(String(inv.id))}
                                className="h-4 w-4 rounded border-edge bg-inset text-accent focus:ring-accent/20 cursor-pointer accent-teal-600 transition-all"
                              />
                            </TableCell>
                          )}
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
                              {inv.status === "voided" && onDeleteSingle && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  loading={busyId === inv.id}
                                  onClick={() => onDeleteSingle(inv.id)}
                                  className="h-8 text-xs text-danger-fg hover:text-danger-fg hover:bg-danger-bg"
                                  title="Permanently Delete Cancelled Invoice"
                                >
                                  {busyId !== inv.id && (
                                    <>
                                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                                      Delete
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

        {/* Table Footer with Pagination Controls */}
        {!loading && totalCount > 0 && onPageChange && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-edge bg-card/60 text-xs text-muted">
            <div>
              Showing <span className="font-semibold text-fg font-mono">{(page - 1) * pageSize + 1}</span> to{" "}
              <span className="font-semibold text-fg font-mono">{Math.min(page * pageSize, totalCount)}</span> of{" "}
              <span className="font-semibold text-fg font-mono">{totalCount}</span> records
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
    </div>
  );
}
