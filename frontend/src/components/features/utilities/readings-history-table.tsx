import { History } from "lucide-react";
import { SectionHeader } from "@/components/common/section-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import type { UtilityReading } from "@/lib/types";

interface ReadingsHistoryTableProps {
  readings: UtilityReading[];
  loading: boolean;
}

export function ReadingsHistoryTable({
  readings,
  loading,
}: ReadingsHistoryTableProps) {
  return (
    <div className="space-y-4">
      <SectionHeader
        icon={<History className="h-5 w-5" />}
        title={`Recent Meter Readings (${loading ? "..." : readings.length})`}
        subtitle="Latest recorded electricity readings per tenant"
      />
      <Card className="p-0 overflow-hidden">
        {!loading && readings.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-semibold text-fg-soft">
              No readings recorded yet
            </p>
            <p className="mt-1 text-xs text-muted">
              Record a meter reading above and it will appear here.
            </p>
          </div>
        ) : (
          <div className="table-scroll-wrap">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resident</TableHead>
                  <TableHead className="text-right">Previous</TableHead>
                  <TableHead className="text-right">Current</TableHead>
                  <TableHead className="text-right">Usage</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-3 w-16 mt-1" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="h-4 w-12 ml-auto" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="h-4 w-12 ml-auto" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="h-5 w-16 ml-auto rounded-full" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="h-4 w-16 ml-auto" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="h-4 w-20 ml-auto" />
                        </TableCell>
                      </TableRow>
                    ))
                  : readings.map((r, i) => (
                      <TableRow key={r.id} index={i}>
                        <TableCell>
                          <p className="font-semibold text-fg-soft">
                            {r.tenant_name}
                          </p>
                          <p className="text-xs text-muted">Room {r.room}</p>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {r.prev_reading}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {r.curr_reading}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="neutral">{r.usage_kwh} kWh</Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-fg tabular-nums">
                          {formatCurrency(r.amount)}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted whitespace-nowrap">
                          {r.date}
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
