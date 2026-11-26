import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/cn";
import type { PropertyPerformance as PropertyPerformanceRow } from "@/lib/services/reports";

interface PropertyPerformanceProps {
  rows: PropertyPerformanceRow[];
  loading: boolean;
}

function yieldVariant(rate: number): "success" | "warning" | "danger" {
  if (rate >= 90) return "success";
  if (rate >= 70) return "warning";
  return "danger";
}

export function PropertyPerformance({ rows, loading }: PropertyPerformanceProps) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-edge px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-fg">
            Property Financial Performance
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            Billed, collected, and receivables breakdown per building · Occupancy reflects current units
          </p>
        </div>
        <span className="text-xs font-medium text-muted tabular-nums">
          {rows.length} {rows.length === 1 ? "building" : "buildings"}
        </span>
      </div>

      <div className="table-scroll-wrap overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead className="text-center">Occupancy</TableHead>
              <TableHead className="text-right">Billed</TableHead>
              <TableHead className="text-right">Collected</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
              <TableHead className="text-right">Collection Yield</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell className="text-center">
                    <Skeleton className="mx-auto h-4 w-20" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-4 w-20" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-4 w-20" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-4 w-20" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-5 w-16 rounded-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-xs text-muted">
                  No property performance records found for this year.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((p) => (
                <TableRow key={p.property_id}>
                  <TableCell>
                    <p className="text-xs font-semibold text-fg">{p.property_name}</p>
                    <p className="text-[11px] text-muted">{p.city}</p>
                  </TableCell>
                  <TableCell className="text-center text-xs tabular-nums">
                    <span className="font-semibold text-fg">
                      {p.occupied_units}/{p.total_units}
                    </span>
                    <span className="ml-1 text-muted">({p.occupancy_rate}%)</span>
                  </TableCell>
                  <TableCell className="text-right text-xs font-medium text-fg tabular-nums">
                    {p.billed_amount > 0 ? formatCurrency(p.billed_amount) : "—"}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right text-xs font-semibold tabular-nums",
                      p.collected_amount > 0 ? "text-success-fg" : "text-muted"
                    )}
                  >
                    {p.collected_amount > 0 ? formatCurrency(p.collected_amount) : "—"}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right text-xs font-semibold tabular-nums",
                      p.outstanding_amount > 0 ? "text-danger-fg" : "text-muted"
                    )}
                  >
                    {p.outstanding_amount > 0 ? formatCurrency(p.outstanding_amount) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {p.bill_count === 0 ? (
                      <span className="text-[11px] text-muted">No billing</span>
                    ) : (
                      <Badge
                        variant={yieldVariant(p.collection_rate)}
                        className="tabular-nums text-[11px]"
                      >
                        {p.collection_rate}%
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
