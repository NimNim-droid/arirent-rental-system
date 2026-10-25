import { useState, useEffect, useCallback, useMemo } from "react";
import {
  TrendingUp,
  DollarSign,
  AlertOctagon,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
  RotateCw,
  Building2,
  CheckCircle2,
  Clock,
  Layers,
  PieChart,
  BarChart3,
  Percent,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { AlertBanner } from "@/components/ui/alert-banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  reportsService,
  type FinancialReportData,
} from "@/lib/services/reports";
import { propertiesService } from "@/lib/services/properties";
import { formatCurrency } from "@/lib/formatters";
import type { Property } from "@/lib/types";

export default function AdminReports() {
  const [data, setData] = useState<FinancialReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  const loadProperties = useCallback(async () => {
    try {
      const res = await propertiesService.getProperties();
      setProperties(res);
    } catch {
      // Non-blocking
    }
  }, []);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await reportsService.getFinancialReport({
        month: selectedMonth,
        property_id: selectedPropertyId,
      });
      setData(res);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Failed to load financial reports & analytics."
      );
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedPropertyId]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const resetFilters = () => {
    setSelectedMonth("all");
    setSelectedPropertyId("");
  };

  const formatMonthLabel = (ym: string) => {
    try {
      const [year, month] = ym.split("-");
      const date = new Date(Number(year), Number(month) - 1, 1);
      return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    } catch {
      return ym;
    }
  };

  const kpis = data?.kpis;
  const streams = data?.revenue_streams;
  const counts = data?.status_counts;
  const trend = data?.monthly_trend || [];
  const propertyPerf = data?.property_performance || [];
  // Invoices still owing money: not yet due + partially paid + past due
  const openInvoices =
    (counts?.unpaid ?? 0) + (counts?.partially_paid ?? 0) + (counts?.overdue ?? 0);

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Financial Reports & Analytics"
        subtitle="Executive cash flow analysis, receivables, collection efficiency, and property performance."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="gap-2 text-xs font-semibold print:hidden"
            >
              <Printer className="h-4 w-4" />
              <span>Print Report</span>
            </Button>
          </div>
        }
      />

      {error && <AlertBanner variant="danger" message={error} onRetry={loadReport} />}

      {data && !data.reconciliation.is_reconciled && (
        <AlertBanner
          variant="warning"
          message={`${formatCurrency(Math.abs(data.reconciliation.difference))} of collected amount has no confirmed payment record.`}
          className="print:hidden"
        />
      )}

      {/* 2. Unified Single-Line Filter Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 bg-card p-3 rounded-2xl border border-edge shadow-sm print:hidden">
        {/* Left: Section Label / Overview Indicator */}
        <div className="flex items-center gap-2 text-xs font-semibold text-fg px-2">
          <BarChart3 className="h-4 w-4 text-accent" />
          <span>Report Scope:</span>
          <span className="font-mono text-muted font-normal">
            {selectedMonth === "all" ? "All Time" : formatMonthLabel(selectedMonth)} •{" "}
            {selectedPropertyId
              ? properties.find((p) => String(p.id) === String(selectedPropertyId))?.name || "Filtered Property"
              : "All Properties"}
          </span>
        </div>

        {/* Right: Inline Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Month / Period Filter */}
          <div className="w-[140px] sm:w-auto">
            <Select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs h-9 min-w-[135px]"
            >
              <option value="all">All Months</option>
              {(data?.available_months || []).map((ym) => (
                <option key={ym} value={ym}>
                  {formatMonthLabel(ym)}
                </option>
              ))}
            </Select>
          </div>

          {/* Property Filter */}
          <div className="w-[140px] sm:w-auto">
            <Select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="text-xs h-9 min-w-[135px]"
            >
              <option value="">All Properties</option>
              {properties.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Reset Filters Button */}
          {(selectedMonth !== "all" || selectedPropertyId) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-9 px-2.5 text-xs text-muted hover:text-fg gap-1"
              title="Reset all filters"
            >
              <RotateCw className="h-3 w-3" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
          )}

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={loadReport}
            className="h-9 px-2.5 text-xs text-muted hover:text-fg gap-1.5"
            title="Refresh analytics data"
          >
            <RotateCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* 3. Executive KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Collected Revenue */}
        <Card className="p-5 border-edge shadow-sm bg-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-fg-soft uppercase tracking-wider">
              Total Collected
            </span>
            <div className="p-2 rounded-xl bg-success-bg text-success-fg">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-fg font-mono">
                {formatCurrency(kpis?.total_collected ?? 0)}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant="success" className="text-[11px] font-mono">
                  {kpis?.collection_rate ?? 0}% Rate
                </Badge>
                {selectedMonth !== "all" && (kpis?.growth_rate ?? 0) !== 0 && (
                  <span
                    className={`inline-flex items-center text-xs font-semibold ${
                      (kpis?.growth_rate ?? 0) >= 0 ? "text-success-fg" : "text-danger-fg"
                    }`}
                  >
                    {(kpis?.growth_rate ?? 0) >= 0 ? (
                      <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
                    ) : (
                      <ArrowDownRight className="h-3.5 w-3.5 mr-0.5" />
                    )}
                    {Math.abs(kpis?.growth_rate ?? 0)}% vs last mo
                  </span>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* KPI 2: Outstanding Receivables (Debt) */}
        <Card className="p-5 border-edge shadow-sm bg-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-fg-soft uppercase tracking-wider">
              Outstanding Debt
            </span>
            <div className="p-2 rounded-xl bg-danger-bg text-danger-fg">
              <AlertOctagon className="h-4 w-4" />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-danger-fg font-mono">
                {formatCurrency(kpis?.total_outstanding ?? 0)}
              </p>
              <div className="flex flex-wrap items-center gap-x-1.5 mt-1.5 text-xs text-muted">
                <span>
                  {openInvoices} open invoice{openInvoices !== 1 ? "s" : ""}
                </span>
                {(kpis?.overdue_count ?? 0) > 0 && (
                  <span className="font-semibold text-danger-fg">
                    · {formatCurrency(kpis?.overdue_amount ?? 0)} past due
                  </span>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* KPI 3: Gross Billed Volume */}
        <Card className="p-5 border-edge shadow-sm bg-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-fg-soft uppercase tracking-wider">
              Gross Billed
            </span>
            <div className="p-2 rounded-xl bg-accent-soft text-accent">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-fg font-mono">
                {formatCurrency(kpis?.total_billed ?? 0)}
              </p>
              <p className="text-xs text-muted mt-1.5">
                Across {counts?.total_bills ?? 0} total generated cycle
                {counts?.total_bills !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </Card>

        {/* KPI 4: Collection Efficiency */}
        <Card className="p-5 border-edge shadow-sm bg-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-fg-soft uppercase tracking-wider">
              Collection Efficiency
            </span>
            <div className="p-2 rounded-xl bg-inset text-muted">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-fg font-mono">
                  {kpis?.collection_rate ?? 0}%
                </span>
                <span className="text-xs text-muted">of billed cash</span>
              </div>
              <div className="w-full bg-inset rounded-full h-2 mt-2.5 overflow-hidden">
                <div
                  className="bg-accent h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, kpis?.collection_rate ?? 0))}%` }}
                />
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* 4. Two-Column Insights Grid: Revenue Stream Breakdown & Invoice Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Revenue Source Breakdown */}
        <Card className="p-5 border-edge shadow-sm bg-card space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-edge">
            <div>
              <h3 className="text-sm font-bold text-fg flex items-center gap-2">
                <PieChart className="h-4 w-4 text-accent" />
                Revenue Streams Breakdown
              </h3>
              <p className="text-xs text-muted mt-0.5">
                Distribution of income across rent, utilities, and incidental items
              </p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3 pt-2">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ) : (
            <div className="space-y-3.5 pt-1">
              {/* Base Rent */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-fg flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                    Base Apartment Rent
                  </span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-fg">{formatCurrency(streams?.rent.amount ?? 0)}</span>
                    <span className="text-muted text-[11px]">({streams?.rent.percentage ?? 0}%)</span>
                  </div>
                </div>
                <div className="w-full bg-inset rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-accent h-2 rounded-full transition-all duration-500"
                    style={{ width: `${streams?.rent.percentage ?? 0}%` }}
                  />
                </div>
              </div>

              {/* Electricity Reimbursements */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-fg flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    Electricity Sub-Meter (kWh)
                  </span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-fg">{formatCurrency(streams?.electricity.amount ?? 0)}</span>
                    <span className="text-muted text-[11px]">({streams?.electricity.percentage ?? 0}%)</span>
                  </div>
                </div>
                <div className="w-full bg-inset rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${streams?.electricity.percentage ?? 0}%` }}
                  />
                </div>
              </div>

              {/* Water Flat Rate */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-fg flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
                    Water Charges (Flat Rate)
                  </span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-fg">{formatCurrency(streams?.water.amount ?? 0)}</span>
                    <span className="text-muted text-[11px]">({streams?.water.percentage ?? 0}%)</span>
                  </div>
                </div>
                <div className="w-full bg-inset rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-cyan-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${streams?.water.percentage ?? 0}%` }}
                  />
                </div>
              </div>

              {/* Incidental Excess Charges */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-fg flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    Incidental & Excess Charges
                  </span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-fg">{formatCurrency(streams?.excess_charges.amount ?? 0)}</span>
                    <span className="text-muted text-[11px]">({streams?.excess_charges.percentage ?? 0}%)</span>
                  </div>
                </div>
                <div className="w-full bg-inset rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${streams?.excess_charges.percentage ?? 0}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Right: Invoice Status & Health Distribution */}
        <Card className="p-5 border-edge shadow-sm bg-card space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-edge">
            <div>
              <h3 className="text-sm font-bold text-fg flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success-fg" />
                Invoice Settlement Health
              </h3>
              <p className="text-xs text-muted mt-0.5">
                Current invoice lifecycle status across the portfolio
              </p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3 pt-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              {/* Paid */}
              <div className="p-3 rounded-xl bg-success-bg/40 border border-success-border/60 space-y-1">
                <span className="text-[11px] font-semibold text-success-fg flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Fully Paid
                </span>
                <p className="text-xl font-bold font-mono text-fg">{counts?.paid ?? 0}</p>
                <p className="text-[10px] text-muted">Settled in full</p>
              </div>

              {/* Partially Paid */}
              <div className="p-3 rounded-xl bg-warning-bg/40 border border-warning-border/60 space-y-1">
                <span className="text-[11px] font-semibold text-warning-fg flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Partial
                </span>
                <p className="text-xl font-bold font-mono text-fg">{counts?.partially_paid ?? 0}</p>
                <p className="text-[10px] text-muted">Installments active</p>
              </div>

              {/* Unpaid */}
              <div className="p-3 rounded-xl bg-danger-bg/40 border border-danger-border/60 space-y-1">
                <span className="text-[11px] font-semibold text-danger-fg flex items-center gap-1">
                  <AlertOctagon className="h-3 w-3" /> Unpaid
                </span>
                <p className="text-xl font-bold font-mono text-fg">{counts?.unpaid ?? 0}</p>
                <p className="text-[10px] text-muted">Not yet due</p>
              </div>

              {/* Overdue */}
              <div className="p-3 rounded-xl bg-danger-bg/60 border border-danger-border space-y-1">
                <span className="text-[11px] font-semibold text-danger-fg flex items-center gap-1">
                  <AlertOctagon className="h-3 w-3" /> Overdue
                </span>
                <p className="text-xl font-bold font-mono text-danger-fg">{counts?.overdue ?? 0}</p>
                <p className="text-[10px] text-muted">
                  Past due · {formatCurrency(kpis?.overdue_amount ?? 0)}
                </p>
              </div>

              {/* Pending Approval */}
              <div className="p-3 rounded-xl bg-inset border border-edge space-y-1">
                <span className="text-[11px] font-semibold text-accent flex items-center gap-1">
                  <Clock className="h-3 w-3" /> In Review
                </span>
                <p className="text-xl font-bold font-mono text-fg">{counts?.pending_verification ?? 0}</p>
                <p className="text-[10px] text-muted">Proof uploaded</p>
              </div>

              {/* Total Invoices */}
              <div className="p-3 rounded-xl bg-inset border border-edge space-y-1">
                <span className="text-[11px] font-semibold text-fg-soft flex items-center gap-1">
                  <Layers className="h-3 w-3" /> Total Records
                </span>
                <p className="text-xl font-bold font-mono text-fg">{counts?.total_bills ?? 0}</p>
                <p className="text-[10px] text-muted">Portfolio invoices</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* 5. Last 6 Months Cash Flow Progression */}
      <Card className="p-5 border-edge shadow-sm bg-card space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-edge">
          <div>
            <h3 className="text-sm font-bold text-fg flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" />
              6-Month Cash Flow Trend
            </h3>
            <p className="text-xs text-muted mt-0.5">
              Comparison of billed invoicing volume vs. actual collected revenue
            </p>
          </div>
        </div>

        {loading ? (
          <Skeleton className="h-28 w-full" />
        ) : trend.length === 0 ? (
          <p className="text-xs text-muted py-4 text-center">No trend history available.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {trend.map((m) => {
              const monthRate = m.billed > 0 ? Math.round((m.collected / m.billed) * 100) : 0;
              return (
                <div
                  key={m.month}
                  className="p-3 rounded-xl border border-edge bg-inset/40 space-y-2 text-center"
                >
                  <p className="text-xs font-bold text-fg">{m.label}</p>
                  <div>
                    <p className="text-xs font-bold text-success-fg font-mono">
                      {formatCurrency(m.collected)}
                    </p>
                    <p className="text-[10px] text-muted font-mono mt-0.5">
                      of {formatCurrency(m.billed)}
                    </p>
                  </div>
                  <Badge
                    variant={monthRate >= 90 ? "success" : monthRate >= 70 ? "warning" : "neutral"}
                    className="text-[10px] font-mono px-1.5 py-0.2 mx-auto"
                  >
                    {monthRate}% Rate
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* 6. Property Financial Performance Breakdown Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-sm font-bold text-fg flex items-center gap-2">
              <Building2 className="h-4 w-4 text-accent" />
              Building & Property Financial Performance
            </h3>
            <p className="text-xs text-muted">
              Individual collection yield, occupancy rate, and receivables by building
            </p>
          </div>
          <Badge variant="neutral" className="text-xs font-mono">
            {propertyPerf.length} Building{propertyPerf.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        <Card className="p-0 overflow-hidden shadow-sm border-edge">
          <div className="table-scroll-wrap overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold text-xs">Property / Location</TableHead>
                  <TableHead className="font-semibold text-xs text-center">Occupancy</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Billed Amount</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Collected Revenue</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Outstanding Debt</TableHead>
                  <TableHead className="font-semibold text-xs text-center">Collection Yield</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-4 w-20 mx-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-5 w-16 mx-auto rounded-full" /></TableCell>
                    </TableRow>
                  ))
                ) : propertyPerf.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-xs text-muted">
                      No property performance records found for this period.
                    </TableCell>
                  </TableRow>
                ) : (
                  propertyPerf.map((p) => {
                    return (
                      <TableRow key={p.property_id} className="hover:bg-card/50 transition-colors">
                        {/* Property */}
                        <TableCell>
                          <p className="text-xs font-bold text-fg">{p.property_name}</p>
                          <p className="text-[11px] text-muted">{p.city}</p>
                        </TableCell>

                        {/* Occupancy */}
                        <TableCell className="text-center font-mono text-xs">
                          <span className="font-semibold text-fg">
                            {p.occupied_units} / {p.total_units}
                          </span>
                          <span className="text-[11px] text-muted ml-1">
                            ({p.occupancy_rate}%)
                          </span>
                        </TableCell>

                        {/* Billed */}
                        <TableCell className="text-right font-mono text-xs font-semibold text-fg">
                          {formatCurrency(p.billed_amount)}
                        </TableCell>

                        {/* Collected */}
                        <TableCell className="text-right font-mono text-xs font-bold text-success-fg">
                          {formatCurrency(p.collected_amount)}
                        </TableCell>

                        {/* Outstanding */}
                        <TableCell className="text-right font-mono text-xs font-bold text-danger-fg">
                          {formatCurrency(p.outstanding_amount)}
                        </TableCell>

                        {/* Yield Badge */}
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              p.collection_rate >= 90
                                ? "success"
                                : p.collection_rate >= 75
                                ? "warning"
                                : "danger"
                            }
                            className="font-mono text-[11px]"
                          >
                            {p.collection_rate}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* 7. Print Footer (Only shown when printing) */}
      <div className="hidden print:block pt-8 text-center text-xs text-muted border-t border-edge">
        <p className="font-semibold text-fg">AriRent Property & Financial Management System</p>
        <p className="text-[11px] mt-0.5">
          Report generated on {new Date().toLocaleDateString("en-US", { dateStyle: "long" })}. Confidential landlord financial document.
        </p>
      </div>
    </div>
  );
}
