import { useState, useEffect, useCallback, useMemo } from "react";
import { AlertCircle, Tag, CheckCircle2, Clock } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertBanner } from "@/components/ui/alert-banner";
import { SkeletonRows } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { excessChargesService } from "@/lib/services/excess-charges";
import { formatCurrency } from "@/lib/formatters";
import { getErrorMessage } from "@/lib/errors";
import type { ExcessCharge } from "@/lib/types";

type StatusFilter = "all" | "pending" | "billed" | "paid";

export default function TenantExcessCharges() {
  const [charges, setCharges] = useState<ExcessCharge[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [filter, setFilter] = useState<StatusFilter>("all");

  const loadCharges = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await excessChargesService.getCharges();
      setCharges(data);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load excess charges."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCharges();
  }, [loadCharges]);

  const filteredCharges = useMemo(() => {
    if (filter === "all") return charges;
    return charges.filter((c) => c.status === filter);
  }, [charges, filter]);

  const stats = useMemo(() => {
    const pendingTotal = charges
      .filter((c) => c.status === "pending")
      .reduce((sum, c) => sum + Number(c.amount), 0);

    const billedTotal = charges
      .filter((c) => c.status === "billed")
      .reduce((sum, c) => sum + Number(c.amount), 0);

    const paidTotal = charges
      .filter((c) => c.status === "paid")
      .reduce((sum, c) => sum + Number(c.amount), 0);

    return {
      pendingTotal,
      pendingCount: charges.filter((c) => c.status === "pending").length,
      billedTotal,
      billedCount: charges.filter((c) => c.status === "billed").length,
      paidTotal,
    };
  }, [charges]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Incidental & Excess Charges"
        subtitle="Itemized record of appliance additions, property maintenance, and administrative fees"
      />

      {error && <AlertBanner variant="danger" message={error} onRetry={loadCharges} />}

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-warning-fg" /> Pending (unbilled)
            </p>
            <p className="text-lg font-semibold text-fg tabular-nums">
              {formatCurrency(stats.pendingTotal)}
            </p>
            <p className="text-[11px] text-muted">
              {stats.pendingCount} charge{stats.pendingCount !== 1 ? "s" : ""} pending next invoice
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-accent" /> Invoiced
            </p>
            <p className="text-lg font-semibold text-fg tabular-nums">
              {formatCurrency(stats.billedTotal)}
            </p>
            <p className="text-[11px] text-muted">
              {stats.billedCount} attached to monthly statements
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-success-fg" /> Settled / Paid
            </p>
            <p className="text-lg font-semibold text-success-fg tabular-nums">
              {formatCurrency(stats.paidTotal)}
            </p>
            <p className="text-[11px] text-muted">
              Cleared with settled invoices
            </p>
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-md bg-inset border border-edge w-fit">
        {(
          [
            { id: "all", label: "All charges" },
            { id: "pending", label: "Pending unbilled" },
            { id: "billed", label: "Invoiced" },
            { id: "paid", label: "Paid" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`px-3 py-1.5 rounded text-[13px] font-medium transition-colors ${
              filter === tab.id
                ? "bg-card text-fg shadow-soft border border-edge"
                : "text-muted hover:text-fg hover:bg-card/40"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Charges Ledger Card */}
      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="p-5">
            <SkeletonRows rows={4} />
          </div>
        ) : filteredCharges.length === 0 ? (
          <EmptyState
            title="No excess charges recorded"
            description="You do not have any incidental fees or appliance charges in this category."
          />
        ) : (
          <div className="table-scroll-wrap">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Charge Title</TableHead>
                  <TableHead>Description / Reason</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCharges.map((charge) => (
                  <TableRow key={charge.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted">
                      {charge.charge_date}
                    </TableCell>
                    <TableCell className="font-semibold text-fg">
                      {charge.title}
                    </TableCell>
                    <TableCell className="text-xs text-muted max-w-xs truncate">
                      {charge.description || "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums text-fg whitespace-nowrap">
                      {formatCurrency(charge.amount)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-xs text-muted">
                      {charge.bill_id ? `#${charge.bill_id}` : "Unattached"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        dot
                        variant={
                          charge.status === "paid"
                            ? "success"
                            : charge.status === "billed"
                            ? "info"
                            : charge.status === "pending"
                            ? "warning"
                            : "neutral"
                        }
                      >
                        {charge.status === "pending"
                          ? "Pending Next Bill"
                          : charge.status === "billed"
                          ? "Added to Bill"
                          : charge.status === "paid"
                          ? "Paid"
                          : charge.status}
                      </Badge>
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
