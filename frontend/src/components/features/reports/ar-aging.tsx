import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { formatCurrency, formatDate } from "@/lib/formatters";
import { cn } from "@/lib/cn";
import type { ArAging as ArAgingData, ArAgingBucketKey } from "@/lib/services/reports";

const COLLAPSED_ROWS = 8;

const BUCKET_META: Record<
  ArAgingBucketKey,
  { accent: string; labelColor: string; badge: "neutral" | "warning" | "danger" }
> = {
  current: { accent: "bg-success-fg", labelColor: "text-success-fg", badge: "neutral" },
  "1_30": { accent: "bg-warning-fg", labelColor: "text-warning-fg", badge: "warning" },
  "31_60": { accent: "bg-warning-fg", labelColor: "text-warning-fg", badge: "warning" },
  "61_90": { accent: "bg-danger-fg", labelColor: "text-danger-fg", badge: "danger" },
  over_90: { accent: "bg-danger-fg", labelColor: "text-danger-fg", badge: "danger" },
};

interface ArAgingProps {
  aging?: ArAgingData;
  loading: boolean;
}

export function ArAging({ aging, loading }: ArAgingProps) {
  const [expanded, setExpanded] = useState(false);

  const items = aging?.items ?? [];
  const total = aging?.total_outstanding ?? 0;
  const visibleItems = expanded ? items : items.slice(0, COLLAPSED_ROWS);
  const hiddenCount = items.length - COLLAPSED_ROWS;

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-edge px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-fg">
            Accounts Receivable Aging
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            Unpaid balances by days past due{aging ? ` as of ${formatDate(aging.as_of)}` : ""} ·
            Excludes payments awaiting review
          </p>
        </div>
        {!loading && (
          <span className="text-xs font-semibold tabular-nums text-fg">
            {formatCurrency(total)}{" "}
            <span className="font-normal text-muted">total owed</span>
          </span>
        )}
      </div>

      {loading ? (
        <div className="p-5 space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 divide-y divide-edge border-b border-edge bg-inset/25 sm:grid-cols-3 lg:grid-cols-5 lg:divide-y-0 lg:divide-x">
            {(aging?.buckets ?? []).map((bucket) => {
              const meta = BUCKET_META[bucket.key];
              const hasBalance = bucket.amount > 0;
              const share = total > 0 ? Math.round((bucket.amount / total) * 100) : 0;

              return (
                <div key={bucket.key} className="relative px-4 py-3.5">
                  {hasBalance && (
                    <span
                      aria-hidden="true"
                      className={cn("absolute inset-x-0 top-0 h-0.5", meta.accent)}
                    />
                  )}
                  <p
                    className={cn(
                      "text-[11px] font-medium",
                      hasBalance ? meta.labelColor : "text-muted"
                    )}
                  >
                    {bucket.label}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-base font-semibold tabular-nums",
                      hasBalance ? "text-fg" : "text-muted/60"
                    )}
                  >
                    {hasBalance ? formatCurrency(bucket.amount) : "—"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted tabular-nums">
                    {bucket.bill_count} invoice{bucket.bill_count !== 1 ? "s" : ""}
                    {hasBalance ? ` · ${share}%` : ""}
                  </p>
                </div>
              );
            })}
          </div>

          {items.length === 0 ? (
            <p className="px-5 py-8 text-center text-xs text-muted">
              No overdue or unpaid balances. All invoices are settled or awaiting verification.
            </p>
          ) : (
            <div>
              <div className="table-scroll-wrap overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Property / Unit</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleItems.map((item) => {
                      const meta = BUCKET_META[item.bucket];
                      return (
                        <TableRow key={item.bill_id}>
                          <TableCell>
                            <p className="text-xs font-semibold text-fg">{item.tenant_name}</p>
                            {item.status === "partially_paid" && (
                              <p className="text-[11px] text-muted">Partially paid</p>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted">
                            {item.property_name ?? "—"}
                            {item.room ? ` · Room ${item.room}` : ""}
                          </TableCell>
                          <TableCell className="text-xs text-muted tabular-nums">
                            {formatDate(item.due_date)}
                          </TableCell>
                          <TableCell className="text-center">
                            {item.bucket === "current" ? (
                              <span className="text-[11px] text-muted">Current</span>
                            ) : (
                              <Badge variant={meta.badge} className="tabular-nums text-[11px]">
                                {item.days_past_due}d late
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-xs font-semibold text-fg tabular-nums">
                            {formatCurrency(item.remaining_balance)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {hiddenCount > 0 && (
                <div className="flex justify-center border-t border-edge py-2 print:hidden">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpanded((v) => !v)}
                    className="gap-1 text-xs text-muted hover:text-fg"
                  >
                    {expanded ? (
                      <>
                        <ChevronUp className="h-3.5 w-3.5" /> Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3.5 w-3.5" /> Show all {items.length} invoices
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </Card>
  );
}
