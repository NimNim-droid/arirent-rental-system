import { Eye, Ban } from "lucide-react";
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
import { formatCurrency } from "@/lib/formatters";
import type { Bill } from "@/lib/types";

interface InvoiceTableProps {
  bills: Bill[];
  loading: boolean;
  busyId: string | null;
  onView: (bill: Bill) => void;
  onVoid: (id: string) => void;
}

export function InvoiceTable({
  bills,
  loading,
  busyId,
  onView,
  onVoid,
}: InvoiceTableProps) {
  const getBadgeVariant = (status: Bill["status"]) => {
    switch (status) {
      case "paid":
        return "success";
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
        subtitle={loading ? "Loading invoices..." : `${bills.length} invoices`}
      />

      <Card className="p-0 overflow-hidden">
        {!loading && bills.length === 0 ? (
          <EmptyState
            title="No invoices yet"
            description="Generate monthly bills to get started."
          />
        ) : (
          <div className="table-scroll-wrap">
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
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-4 w-12" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-3 w-16 mt-1" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="h-4 w-16 ml-auto" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="h-4 w-16 ml-auto" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="h-4 w-16 ml-auto" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="h-4 w-20 ml-auto" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-16 rounded-full" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="h-7 w-12 ml-auto rounded-lg" />
                        </TableCell>
                      </TableRow>
                    ))
                  : bills.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-mono font-bold text-fg-soft whitespace-nowrap">
                          {inv.id}
                        </TableCell>
                        <TableCell>
                          <p className="font-bold text-fg">{inv.tenant_name}</p>
                          <p className="text-xs text-muted">Room {inv.room}</p>
                        </TableCell>
                        <TableCell className="text-right text-xs font-semibold text-muted tabular-nums">
                          {formatCurrency(inv.rent)}
                        </TableCell>
                        <TableCell className="text-right text-xs font-semibold text-muted tabular-nums">
                          {formatCurrency(inv.electricity)}
                        </TableCell>
                        <TableCell className="text-right text-xs font-semibold text-muted tabular-nums">
                          {formatCurrency(inv.water)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-fg tabular-nums whitespace-nowrap">
                          {formatCurrency(inv.total_amount)}
                        </TableCell>
                        <TableCell className="text-xs text-muted whitespace-nowrap">
                          {inv.due_date}
                        </TableCell>
                        <TableCell>
                          <Badge dot variant={getBadgeVariant(inv.status)}>
                            {inv.status === "pending_verification"
                              ? "Pending"
                              : inv.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onView(inv)}
                              className="text-accent hover:text-accent-strong"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                            {inv.status !== "paid" && inv.status !== "voided" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                loading={busyId === inv.id}
                                onClick={() => onVoid(inv.id)}
                                className="text-danger-fg hover:text-danger-fg hover:bg-danger-bg"
                              >
                                {busyId !== inv.id && (
                                  <>
                                    <Ban className="h-4 w-4" />
                                    Void
                                  </>
                                )}
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
    </div>
  );
}
