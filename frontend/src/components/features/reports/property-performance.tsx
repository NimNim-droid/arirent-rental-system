import { Building2 } from "lucide-react";
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
import type { PropertyPerformance as PropertyPerformanceRow } from "@/lib/services/reports";

interface PropertyPerformanceProps {
  rows: PropertyPerformanceRow[];
  loading: boolean;
}

function yieldVariant(rate: number): "success" | "warning" | "danger" {
  if (rate >= 90) return "success";
  if (rate >= 75) return "warning";
  return "danger";
}

export function PropertyPerformance({ rows, loading }: PropertyPerformanceProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-sm font-bold text-fg flex items-center gap-2">
            <Building2 className="h-4 w-4 text-accent" />
            Building &amp; Property Financial Performance
          </h3>
          <p className="text-xs text-muted">
            Collection yield and receivables by building. Occupancy is today's figure and does not
            change with the Month filter.
          </p>
        </div>
        <Badge variant="neutral" className="text-xs font-mono">
          {rows.length} Building{rows.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      <Card className="p-0 overflow-hidden shadow-sm border-edge">
        <div className="table-scroll-wrap overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold text-xs">Property / Location</TableHead>
                <TableHead className="font-semibold text-xs text-center">
                  Occupancy (today)
                </TableHead>
                <TableHead className="font-semibold text-xs text-right">Billed Amount</TableHead>
                <TableHead className="font-semibold text-xs text-right">
                  Collected Revenue
                </TableHead>
                <TableHead className="font-semibold text-xs text-right">Outstanding Debt</TableHead>
                <TableHead className="font-semibold text-xs text-center">Collection Yield</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-36" />
                    </TableCell>
                    <TableCell className="text-center">
                      <Skeleton className="h-4 w-20 mx-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-20 ml-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-20 ml-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-20 ml-auto" />
                    </TableCell>
                    <TableCell className="text-center">
                      <Skeleton className="h-5 w-16 mx-auto rounded-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-xs text-muted">
                    No property performance records found for this period.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((p) => (
                  <TableRow key={p.property_id} className="hover:bg-card/50 transition-colors">
                    <TableCell>
                      <p className="text-xs font-bold text-fg">{p.property_name}</p>
                      <p className="text-[11px] text-muted">{p.city}</p>
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs">
                      <span className="font-semibold text-fg">
                        {p.occupied_units} / {p.total_units}
                      </span>
                      <span className="text-[11px] text-muted ml-1">({p.occupancy_rate}%)</span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-semibold text-fg">
                      {formatCurrency(p.billed_amount)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold text-success-fg">
                      {formatCurrency(p.collected_amount)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold text-danger-fg">
                      {formatCurrency(p.outstanding_amount)}
                    </TableCell>
                    <TableCell className="text-center">
                      {p.bill_count === 0 ? (
                        <span className="text-[11px] text-muted">No billing</span>
                      ) : (
                        <Badge
                          variant={yieldVariant(p.collection_rate)}
                          className="font-mono text-[11px]"
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
    </div>
  );
}
