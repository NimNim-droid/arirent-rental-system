import { useState } from "react";
import { ChevronDown, ChevronUp, Hourglass } from "lucide-react";
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
import type { ArAging as ArAgingData, ArAgingBucketKey } from "@/lib/services/reports";

const COLLAPSED_ROWS = 8;

interface BucketStyle {
  tile: string;
  text: string;
  bar: string;
  badge: "neutral" | "warning" | "danger";
}

/** Colour deepens as money gets later; red is reserved for 61+ days. */
const BUCKET_STYLES: Record<ArAgingBucketKey, BucketStyle> = {
  current: {
    tile: "bg-success-bg/40 border-success-border/60",
    text: "text-success-fg",
    bar: "bg-success-fg/60",
    badge: "neutral",
  },
  "1_30": {
    tile: "bg-warning-bg/40 border-warning-border/60",
    text: "text-warning-fg",
    bar: "bg-warning-fg/60",
    badge: "warning",
  },
  "31_60": {
    tile: "bg-warning-bg/70 border-warning-border",
    text: "text-warning-fg",
    bar: "bg-warning-fg",
    badge: "warning",
  },
  "61_90": {
    tile: "bg-danger-bg/40 border-danger-border/60",
    text: "text-danger-fg",
    bar: "bg-danger-fg/70",
    badge: "danger",
  },
  over_90: {
    tile: "bg-danger-bg/70 border-danger-border",
    text: "text-danger-fg",
    bar: "bg-danger-fg",
    badge: "danger",
  },
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
    <Card className="p-5 border-edge shadow-sm bg-card space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2 pb-2 border-b border-edge">
        <div>
          <h3 className="text-sm font-bold text-fg flex items-center gap-2">
            <Hourglass className="h-4 w-4 text-accent" />
            Accounts Receivable Aging
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Unpaid balances by how late they are{aging ? `, as of ${formatDate(aging.as_of)}` : ""}.
            The Month filter does not apply here; the Property filter does. Invoices with a payment
            awaiting review are not included.
          </p>
        </div>
        {!loading && (
          <Badge variant="neutral" className="font-mono text-xs">
            {formatCurrency(total)} owed
          </Badge>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {(aging?.buckets ?? []).map((bucket) => {
              const style = BUCKET_STYLES[bucket.key];
              const share = total > 0 ? Math.round((bucket.amount / total) * 100) : 0;
              return (
                <div
                  key={bucket.key}
                  className={`p-3 rounded-xl border space-y-1.5 ${style.tile}`}
                >
                  <span className={`text-[11px] font-semibold ${style.text}`}>{bucket.label}</span>
                  <p
                    className={`text-base font-bold font-mono ${
                      bucket.amount > 0 ? "text-fg" : "text-muted"
                    }`}
                  >
                    {formatCurrency(bucket.amount)}
                  </p>
                  <p className="text-[10px] text-muted">
                    {bucket.bill_count} invoice{bucket.bill_count !== 1 ? "s" : ""} · {share}%
                  </p>
                  <div className="w-full bg-inset rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`${style.bar} h-1.5 rounded-full transition-all duration-500`}
                      style={{ width: `${share}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {items.length === 0 ? (
            <p className="text-xs text-muted py-4 text-center">
              Nothing owed right now. Every invoice is paid or awaiting review.
            </p>
          ) : (
            <div className="rounded-xl border border-edge overflow-hidden">
              <div className="table-scroll-wrap overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold text-xs">Tenant</TableHead>
                      <TableHead className="font-semibold text-xs">Property / Room</TableHead>
                      <TableHead className="font-semibold text-xs">Due Date</TableHead>
                      <TableHead className="font-semibold text-xs text-center">Days Late</TableHead>
                      <TableHead className="font-semibold text-xs text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleItems.map((item) => {
                      const style = BUCKET_STYLES[item.bucket];
                      return (
                        <TableRow key={item.bill_id} className="hover:bg-card/50 transition-colors">
                          <TableCell>
                            <p className="text-xs font-bold text-fg">{item.tenant_name}</p>
                            {item.status === "partially_paid" && (
                              <p className="text-[11px] text-muted">Partially paid</p>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-fg-soft">
                            {item.property_name ?? "—"}
                            {item.room ? ` · Room ${item.room}` : ""}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-fg-soft">
                            {formatDate(item.due_date)}
                          </TableCell>
                          <TableCell className="text-center">
                            {item.bucket === "current" ? (
                              <span className="text-[11px] text-muted">Not yet due</span>
                            ) : (
                              <Badge variant={style.badge} className="font-mono text-[11px]">
                                {item.days_past_due} day{item.days_past_due !== 1 ? "s" : ""}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs font-bold text-fg">
                            {formatCurrency(item.remaining_balance)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {hiddenCount > 0 && (
                <div className="flex justify-center border-t border-edge p-2 print:hidden">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpanded((v) => !v)}
                    className="text-xs gap-1 text-muted hover:text-fg"
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
