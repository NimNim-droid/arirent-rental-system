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
}

export function ReadingsHistoryTable({
  readings,
  loading,
  defaultElecRate,
  onDelete,
  deletingId,
  onViewProof,
}: ReadingsHistoryTableProps) {
  const [readingToDelete, setReadingToDelete] = useState<UtilityReading | null>(null);

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
      <Card className="p-0 overflow-hidden border border-border">
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
                <TableRow className="bg-subtle/50">
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
                  : readings.map((r) => {
                      const appliedRate = getComputedRate(r);
                      const isDeleting = deletingId === String(r.id);

                      return (
                        <TableRow key={r.id} className="hover:bg-subtle/40 transition-colors">
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
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-subtle text-fg font-mono font-medium text-[11px] border border-border">
                              <span>{Number(r.prev_reading).toLocaleString()}</span>
                              <ArrowRight className="h-3 w-3 text-muted" />
                              <span className="font-semibold text-primary">{Number(r.curr_reading).toLocaleString()}</span>
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
                          <TableCell className="text-xs font-bold text-fg text-right whitespace-nowrap">
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
                                  className="h-8 w-8 p-0 text-muted hover:text-primary"
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

        {/* Footer info & records count */}
        {!loading && readings.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-subtle/30 text-xs text-muted">
            <span>
              Showing <strong>{readings.length}</strong> record{readings.length !== 1 ? "s" : ""}
            </span>
            <span className="text-[11px]">
              Rates are locked per reading for historical audit integrity.
            </span>
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
        confirmLabel="Delete Reading"
        confirmVariant="danger"
        isLoading={deletingId === readingToDelete?.id}
        onConfirm={async () => {
          if (readingToDelete) {
            await onDelete(readingToDelete.id);
            setReadingToDelete(null);
          }
        }}
        onCancel={() => setReadingToDelete(null)}
      />
    </>
  );
}
