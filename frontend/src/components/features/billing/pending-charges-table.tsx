import { PlusCircle, Trash2 } from "lucide-react";
import { SectionHeader } from "@/components/common/section-header";
import { AlertBanner } from "@/components/ui/alert-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import type { ExcessCharge } from "@/lib/types";

interface PendingChargesTableProps {
  charges: ExcessCharge[];
  loading: boolean;
  error?: string;
  onOpenAddModal: () => void;
  onDeleteCharge: (charge: ExcessCharge) => void;
  onRetry: () => void;
}

export function PendingChargesTable({
  charges,
  loading,
  error,
  onOpenAddModal,
  onDeleteCharge,
  onRetry,
}: PendingChargesTableProps) {
  if (charges.length === 0) return null;

  return (
    <div className="space-y-4 pt-4">
      <SectionHeader
        title="Pending Unbilled Incidental Charges"
        subtitle="Extra charges (repairs, aircon cleaning, lost keys, extra appliances) that will be automatically attached when Generate Bills is executed"
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenAddModal}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Add Charge
          </Button>
        }
      />

      {error && <AlertBanner variant="danger" message={error} onRetry={onRetry} />}

      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="p-5">
            <SkeletonRows rows={3} />
          </div>
        ) : (
          <div className="table-scroll-wrap">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Tenant & Room</TableHead>
                  <TableHead>Charge Title</TableHead>
                  <TableHead>Description / Notes</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {charges.map((charge) => (
                  <TableRow key={charge.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted">
                      {formatDate(charge.charge_date)}
                    </TableCell>
                    <TableCell>
                      <p className="font-bold text-fg text-xs">{charge.tenant_name || "Tenant"}</p>
                      <p className="text-[11px] text-muted">Room {charge.room}</p>
                    </TableCell>
                    <TableCell className="font-semibold text-fg text-xs">
                      {charge.title}
                    </TableCell>
                    <TableCell className="text-xs text-muted max-w-xs truncate">
                      {charge.description || "—"}
                    </TableCell>
                    <TableCell className="text-right font-bold tabular-nums text-fg whitespace-nowrap">
                      {formatCurrency(charge.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge dot variant="warning">
                        Pending Next Bill
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteCharge(charge)}
                        className="text-danger-fg hover:bg-danger/10 h-7 px-2"
                        title="Remove Charge"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
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

