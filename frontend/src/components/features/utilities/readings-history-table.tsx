import { useState } from "react";
import { Trash2, Image, CheckCircle, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { UtilityReading } from "@/lib/types";

interface ReadingsHistoryTableProps {
  readings: UtilityReading[];
  loading: boolean;
  defaultElecRate: number;
  onDelete: (id: string) => Promise<void>;
  deletingId: string | null;
  onViewProof?: (url: string) => void;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
}

export function ReadingsHistoryTable({
  readings,
  loading,
  defaultElecRate,
  onDelete,
  deletingId,
  onViewProof,
  page,
  pageSize = 10,
  onPageChange,
}: ReadingsHistoryTableProps) {
  const [readingToDelete, setReadingToDelete] = useState<UtilityReading | null>(null);
  const [internalPage, setInternalPage] = useState(1);

  const currentPage = page ?? internalPage;
  const currentSize = pageSize;
  const totalCount = readings.length;
  const totalPages = Math.ceil(totalCount / currentSize) || 1;

  const handlePageChange = (p: number) => {
    if (onPageChange) {
      onPageChange(p);
    } else {
      setInternalPage(p);
    }
  };

  const paginatedReadings = readings.slice(
    (currentPage - 1) * currentSize,
    currentPage * currentSize
  );

  const formatDateDisplay = (dateStr: string) => {
    return formatDate(dateStr);
  };

  const getComputedRate = (r: UtilityReading) => {
    if (r.usage_kwh > 0 && r.amount > 0) {
      return r.amount / r.usage_kwh;
    }
    return defaultElecRate;
  };

  return (
    <>
      <Card className="p-0 overflow-hidden shadow-sm border-edge">
        {!loading && readings.length === 0 ? (
          <div className="p-12 text-center">
            <EmptyState
              title="No meter readings found"
              description="No electricity meter readings match your selected filter criteria. Click '+ Add Reading' above to record a new reading."
            />
          </div>
        ) : (
          <div className="table-scroll-wrap overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold text-xs">Date</TableHead>
                  <TableHead className="font-semibold text-xs">Property</TableHead>
                  <TableHead className="font-semibold text-xs">Unit / Room</TableHead>
                  <TableHead className="font-semibold text-xs">Tenant</TableHead>
                  <TableHead className="font-semibold text-xs text-center">Meter Reading</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Usage</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Rate</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Total</TableHead>
                  <TableHead className="font-semibold text-xs text-center">Status</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-28 mx-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16 mx-auto rounded-full" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  : paginatedReadings.map((r) => {
                      const appliedRate = getComputedRate(r);
                      const isDeleting = deletingId === String(r.id);

                      return (
                        <TableRow key={r.id} className="hover:bg-card/50 transition-colors">
                          {/* Date */}
                          <TableCell className="text-xs font-medium text-fg whitespace-nowrap">
                            {formatDateDisplay(r.date)}
                          </TableCell>

                          {/* Property */}
                          <TableCell className="text-xs text-fg-soft whitespace-nowrap">
                            {r.property_name || "—"}
                          </TableCell>

                          {/* Unit / Room */}
                          <TableCell className="text-xs font-semibold text-fg whitespace-nowrap">
                            {r.room ? (r.room.toLowerCase().startsWith("unit") ? r.room : `Unit ${r.room}`) : "—"}
                          </TableCell>

                          {/* Tenant */}
                          <TableCell className="text-xs font-medium text-fg whitespace-nowrap">
                            {r.tenant_name || `Tenant #${r.tenant_id}`}
                          </TableCell>

                          {/* Meter Reading (Prev -> Curr) */}
                          <TableCell className="text-xs text-center whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-inset text-fg font-mono font-medium text-[11px] border border-edge">
                              <span>{Number(r.prev_reading).toLocaleString()}</span>
                              <ArrowRight className="h-3 w-3 text-muted" />
                              <span className="font-semibold text-accent">{Number(r.curr_reading).toLocaleString()}</span>
                            </span>
                          </TableCell>

                          {/* Usage */}
                          <TableCell className="text-xs font-semibold text-fg text-right whitespace-nowrap">
                            {Number(r.usage_kwh).toFixed(1)} <span className="font-normal text-muted text-[11px]">kWh</span>
                          </TableCell>

                          {/* Rate */}
                          <TableCell className="text-xs text-fg-soft text-right whitespace-nowrap font-mono">
                            ₱{appliedRate.toFixed(2)}<span className="text-[10px] text-muted">/kWh</span>
                          </TableCell>

                          {/* Total */}
                          <TableCell className="text-xs font-bold text-fg text-right whitespace-nowrap font-mono">
                            {formatCurrency(Number(r.amount))}
                          </TableCell>

                          {/* Status */}
                          <TableCell className="text-center whitespace-nowrap">
                            <Badge variant="success" className="gap-1 px-2 py-0.5 text-[11px] font-medium">
                              <CheckCircle className="h-3 w-3" />
                              Posted
                            </Badge>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              {r.meter_photo_url && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-muted hover:text-accent"
                                  title="View Meter Photo Proof"
                                  onClick={() => onViewProof?.(r.meter_photo_url!)}
                                >
                                  <Image className="h-4 w-4" />
                                </Button>
                              )}

                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-muted hover:text-danger-fg"
                                title="Delete Reading"
                                disabled={isDeleting}
                                onClick={() => setReadingToDelete(r)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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
        {!loading && totalCount > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-edge bg-card/60 text-xs text-muted">
            <div>
              Showing <span className="font-semibold text-fg font-mono">{(currentPage - 1) * currentSize + 1}</span> to{" "}
              <span className="font-semibold text-fg font-mono">{Math.min(currentPage * currentSize, totalCount)}</span> of{" "}
              <span className="font-semibold text-fg font-mono">{totalCount}</span> records
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  className="h-7 px-2.5 text-xs font-medium"
                >
                  Previous
                </Button>
                <span className="px-2 font-mono text-xs font-semibold text-fg">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  className="h-7 px-2.5 text-xs font-medium"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(readingToDelete)}
        title="Delete Meter Reading?"
        description={
          readingToDelete
            ? `Are you sure you want to delete the meter reading for ${readingToDelete.tenant_name || "this resident"} (${readingToDelete.room || ""}) on ${formatDateDisplay(readingToDelete.date)}?`
            : ""
        }
        confirmText="Delete Reading"
        variant="danger"
        loading={deletingId === readingToDelete?.id}
        onConfirm={async () => {
          if (readingToDelete) {
            await onDelete(readingToDelete.id);
            setReadingToDelete(null);
          }
        }}
        onClose={() => setReadingToDelete(null)}
      />
    </>
  );
}
