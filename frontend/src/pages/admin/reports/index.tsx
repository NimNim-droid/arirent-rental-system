import { useCallback, useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BarChart3,
  Banknote,
  CalendarDays,
  Download,
  Home,
  Info,
  Printer,
  Receipt,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { AlertBanner } from "@/components/ui/alert-banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { Skeleton, SkeletonRows } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { DonutChart } from "@/components/features/reports/donut-chart";
import { RevenueBarChart } from "@/components/features/reports/revenue-bar-chart";
import {
  RevenueLineChart,
  type RevenueLineSeries,
} from "@/components/features/reports/revenue-line-chart";
import {
  reportsService,
  type FinancialReportData,
  type RevenuePeriod,
} from "@/lib/services/reports";
import { propertiesService } from "@/lib/services/properties";
import { getErrorMessage } from "@/lib/errors";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/cn";
import type { Property } from "@/lib/types";

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, index) => CURRENT_YEAR - index);

const SOURCE_COLORS: Record<string, string> = {
  rent: "#3b82f6",
  electricity: "#22c55e",
  water: "#f59e0b",
  other: "#8b5cf6",
};

const STATUS_COLORS: Record<string, string> = {
  paid: "#22c55e",
  pending: "#f59e0b",
  partially_paid: "#3b82f6",
  overdue: "#ef4444",
};

const PERIOD_OPTIONS: { key: RevenuePeriod; label: string }[] = [
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "yearly", label: "Yearly" },
];

function formatGrowth(value: number): string {
  return Math.abs(value).toFixed(1).replace(/\.0$/, "");
}

interface KpiCardProps {
  title: string;
  value: number;
  growth: number;
  icon: LucideIcon;
  iconClassName: string;
}

function KpiCard({ title, value, growth, icon: Icon, iconClassName }: KpiCardProps) {
  const positive = growth > 0;
  const negative = growth < 0;
  const GrowthIcon = negative ? TrendingDown : TrendingUp;
  const tone = positive
    ? "text-success-fg"
    : negative
      ? "text-danger-fg"
      : "text-muted";

  return (
    <Card className="p-5">
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white shadow-sm",
            iconClassName
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-muted">{title}</p>
          <p className="mt-1 text-xl font-extrabold tracking-tight text-fg tabular-nums">
            {formatCurrency(value)}
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-[11px]">
            {(positive || negative) && (
              <GrowthIcon className={cn("h-3.5 w-3.5 shrink-0", tone)} />
            )}
            <span className={cn("font-bold", tone)}>{formatGrowth(growth)}%</span>
            <span className="text-muted">vs. last year</span>
          </p>
        </div>
      </div>
    </Card>
  );
}

function ReportSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading financial report">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="p-5">
            <div className="flex items-start gap-4">
              <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
              <div className="w-full space-y-2">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 2xl:grid-cols-3">
        <Card className="p-5 2xl:col-span-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-5 h-64 w-full" />
        </Card>
        <Card className="p-5">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="mt-5 h-64 w-full rounded-full" />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="mt-5 h-64 w-full" />
        </Card>
        <Card className="p-5">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="mt-5 h-64 w-full rounded-full" />
        </Card>
      </div>

      <Card className="p-5">
        <Skeleton className="h-5 w-40" />
        <SkeletonRows rows={6} className="mt-5" />
      </Card>
    </div>
  );
}

function csvValue(value: string | number) {
  if (typeof value === "number") {
    return value.toFixed(2);
  }

  return `"${value.replace(/"/g, '""')}"`;
}

export default function AdminReports() {
  const [year, setYear] = useState(CURRENT_YEAR);
  const [propertyId, setPropertyId] = useState("");
  const [period, setPeriod] = useState<RevenuePeriod>("monthly");
  const [data, setData] = useState<FinancialReportData | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProperties = useCallback(async () => {
    try {
      const rows = await propertiesService.getProperties();
      setProperties(rows);
    } catch {
      // Property filter is optional; reporting still works without it.
    }
  }, []);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const report = await reportsService.getFinancialReport({
        year,
        property_id: propertyId || undefined,
      });
      setData(report);
    } catch (err) {
      setData(null);
      setError(getErrorMessage(err, "Unable to load the financial report."));
    } finally {
      setLoading(false);
    }
  }, [year, propertyId]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const yearOptions = useMemo(() => {
    const options = new Set<number>(YEAR_OPTIONS);
    data?.available_years.forEach((value) => options.add(value));
    options.add(year);

    return Array.from(options).sort((a, b) => b - a);
  }, [data, year]);

  const handleExport = () => {
    if (!data || data.financial_summary.length === 0) {
      return;
    }

    const headers = [
      "Period",
      "Total Revenue",
      "Total Rent",
      "Total Utilities",
      "Total Other Charges",
      "Paid",
      "Pending",
      "Partially Paid",
      "Overdue",
      "Outstanding Balance",
    ];

    const rows = data.financial_summary.map((row) => [
      row.period,
      row.total_revenue,
      row.total_rent,
      row.total_utilities,
      row.total_other,
      row.paid,
      row.pending,
      row.partially_paid,
      row.overdue,
      row.outstanding,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((value) => csvValue(value)).join(","))
      .join("\r\n");

    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `financial-report-${data.year}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const kpis = data
    ? [
        {
          title: "Total Revenue Collected",
          value: data.summary.total_revenue,
          growth: data.summary.growth.total_revenue,
          icon: Banknote,
          iconClassName: "bg-emerald-500",
        },
        {
          title: "Total Rent Collected",
          value: data.summary.total_rent,
          growth: data.summary.growth.total_rent,
          icon: Home,
          iconClassName: "bg-blue-500",
        },
        {
          title: "Total Utility Charges",
          value: data.summary.total_utilities,
          growth: data.summary.growth.total_utilities,
          icon: Zap,
          iconClassName: "bg-amber-500",
        },
        {
          title: "Total Other Charges",
          value: data.summary.total_other,
          growth: data.summary.growth.total_other,
          icon: Receipt,
          iconClassName: "bg-violet-500",
        },
      ]
    : [];

  const lineSeries: RevenueLineSeries[] = data
    ? [
        {
          key: "rent",
          label: "Rent",
          color: SOURCE_COLORS.rent,
          values: data.revenue_overview.map((point) => point.rent),
        },
        {
          key: "utilities",
          label: "Utilities",
          color: SOURCE_COLORS.electricity,
          values: data.revenue_overview.map((point) => point.utilities),
        },
        {
          key: "other",
          label: "Other Charges",
          color: "#f97316",
          values: data.revenue_overview.map((point) => point.other),
        },
      ]
    : [];

  const sourceSegments = data
    ? data.revenue_by_source.map((source) => ({
        key: source.key,
        label: source.name,
        value: source.value,
        color: SOURCE_COLORS[source.key] ?? "#94a3b8",
        meta: formatCurrency(source.value),
      }))
    : [];

  const paymentSegments = data
    ? data.payment_status.items.map((item) => ({
        key: item.key,
        label: item.name,
        value: item.count,
        color: STATUS_COLORS[item.key] ?? "#94a3b8",
        meta: String(item.count),
      }))
    : [];

  const totals = useMemo(() => {
    if (!data) {
      return null;
    }

    return data.financial_summary.reduce(
      (acc, row) => ({
        total_revenue: acc.total_revenue + row.total_revenue,
        total_rent: acc.total_rent + row.total_rent,
        total_utilities: acc.total_utilities + row.total_utilities,
        total_other: acc.total_other + row.total_other,
        paid: acc.paid + row.paid,
        pending: acc.pending + row.pending,
        partially_paid: acc.partially_paid + row.partially_paid,
        overdue: acc.overdue + row.overdue,
        outstanding: acc.outstanding + row.outstanding,
      }),
      {
        total_revenue: 0,
        total_rent: 0,
        total_utilities: 0,
        total_other: 0,
        paid: 0,
        pending: 0,
        partially_paid: 0,
        overdue: 0,
        outstanding: 0,
      }
    );
  }, [data]);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<BarChart3 className="h-7 w-7 text-blue-600" strokeWidth={2.5} />}
        title="Financial Report"
        subtitle="Track your rental income, charges, and overall financial performance."
        action={
          <div className="flex w-full flex-col gap-2 print:hidden sm:w-auto sm:shrink-0 sm:flex-row sm:items-center">
            <div className="w-full sm:w-[170px] sm:shrink-0">
              <Select
                aria-label="Filter by property"
                value={propertyId}
                onChange={(event) => setPropertyId(event.target.value)}
                className="h-9 bg-card py-0 text-xs font-semibold"
              >
                <option value="">All Properties</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="relative w-full sm:w-[256px] sm:shrink-0">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted" />
              <Select
                aria-label="Report year"
                value={String(year)}
                onChange={(event) => setYear(Number(event.target.value))}
                className="h-9 bg-card py-0 pl-9 pr-9 text-xs font-semibold"
              >
                {yearOptions.map((option) => (
                  <option key={option} value={option}>
                    {`Jan 1, ${option} - Dec 31, ${option}`}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={loadReport}
                aria-label="Refresh report"
                className="h-9"
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                aria-label="Print report"
                className="h-9 gap-2 text-xs font-semibold print:hidden"
              >
                <Printer className="h-4 w-4" />
                <span className="hidden xl:inline">Print</span>
              </Button>
            </div>
          </div>
        }
      />

      {error ? (
        <Card className="p-8 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-warning-fg" />
          <p className="mt-3 text-sm font-semibold text-fg">{error}</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={loadReport}>
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </Card>
      ) : loading || !data ? (
        <ReportSkeleton />
      ) : (
        <>
          {!data.reconciliation.is_reconciled && (
            <AlertBanner
              variant="warning"
              message={`${formatCurrency(
                Math.abs(data.reconciliation.difference)
              )} of collected amount has no confirmed payment record.`}
              className="print:hidden"
            />
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((kpi) => (
              <KpiCard key={kpi.title} {...kpi} />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-5 2xl:grid-cols-3">
            <Card className="p-5 2xl:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-bold tracking-tight text-fg">
                  Revenue Overview
                </h2>
                <div className="flex flex-wrap items-center gap-3.5">
                  {lineSeries.map((series) => (
                    <span
                      key={series.key}
                      className="flex items-center gap-1.5 text-[11px] font-semibold text-muted"
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: series.color }}
                      />
                      {series.label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-4">
                <RevenueLineChart
                  labels={data.revenue_overview.map((point) => point.month)}
                  series={lineSeries}
                />
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="text-base font-bold tracking-tight text-fg">
                Revenue by Source
              </h2>
              <div className="mt-5">
                <DonutChart
                  segments={sourceSegments}
                  centerValue={formatCurrency(data.summary.total_revenue)}
                  centerLabel="Total Revenue"
                />
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Card className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-bold tracking-tight text-fg">
                  Revenue by Period
                </h2>
                <div className="flex items-center rounded-lg border border-edge bg-inset p-0.5">
                  {PERIOD_OPTIONS.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      aria-pressed={period === option.key}
                      onClick={() => setPeriod(option.key)}
                      className={cn(
                        "rounded-md px-3 py-1 text-[11px] font-semibold transition-colors",
                        period === option.key
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-muted hover:text-fg"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-4">
                <RevenueBarChart points={data.revenue_by_period[period]} />
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="text-base font-bold tracking-tight text-fg">
                Payment Status Overview
              </h2>
              <div className="mt-5">
                <DonutChart
                  segments={paymentSegments}
                  centerValue={String(data.payment_status.total)}
                  centerLabel="Total Invoices"
                />
              </div>
            </Card>
          </div>

          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-edge px-4 py-4 sm:px-5">
              <h2 className="text-base font-bold tracking-tight text-fg">
                Financial Summary
              </h2>
              <span className="text-[11px] font-semibold text-muted">
                {data.range_label}
              </span>
            </div>

            {data.financial_summary.length === 0 ? (
              <EmptyState
                icon={<BarChart3 className="h-5 w-5" />}
                title="No financial activity for this year"
                description="Generate invoices or record payments to populate this report."
              />
            ) : (
              <div className="table-scroll-wrap">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[130px]">Period</TableHead>
                      <TableHead className="text-right">Total Revenue</TableHead>
                      <TableHead className="text-right">Total Rent</TableHead>
                      <TableHead className="text-right">Total Utilities</TableHead>
                      <TableHead className="text-right">Total Other Charges</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Pending</TableHead>
                      <TableHead className="text-right">Partially Paid</TableHead>
                      <TableHead className="text-right">Overdue</TableHead>
                      <TableHead className="text-right">Outstanding Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.financial_summary.map((row) => (
                      <TableRow key={row.period}>
                        <TableCell className="whitespace-nowrap font-semibold text-fg-soft">
                          {row.period}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right font-semibold text-fg tabular-nums">
                          {formatCurrency(row.total_revenue)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right text-muted tabular-nums">
                          {formatCurrency(row.total_rent)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right text-muted tabular-nums">
                          {formatCurrency(row.total_utilities)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right text-muted tabular-nums">
                          {formatCurrency(row.total_other)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right text-success-fg tabular-nums">
                          {formatCurrency(row.paid)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right text-warning-fg tabular-nums">
                          {formatCurrency(row.pending)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right text-muted tabular-nums">
                          {formatCurrency(row.partially_paid)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right text-danger-fg tabular-nums">
                          {formatCurrency(row.overdue)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right font-semibold text-fg tabular-nums">
                          {formatCurrency(row.outstanding)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  {totals && (
                    <tfoot>
                      <tr className="border-t-2 border-edge bg-inset/70 text-xs font-bold text-fg">
                        <td className="whitespace-nowrap px-4 py-3">Total</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                          {formatCurrency(totals.total_revenue)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                          {formatCurrency(totals.total_rent)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                          {formatCurrency(totals.total_utilities)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                          {formatCurrency(totals.total_other)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right text-success-fg tabular-nums">
                          {formatCurrency(totals.paid)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right text-warning-fg tabular-nums">
                          {formatCurrency(totals.pending)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                          {formatCurrency(totals.partially_paid)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right text-danger-fg tabular-nums">
                          {formatCurrency(totals.overdue)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                          {formatCurrency(totals.outstanding)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </Table>
              </div>
            )}

            <div className="flex flex-col items-start justify-between gap-3 border-t border-edge px-4 py-3 sm:flex-row sm:items-center sm:px-5">
              <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Revenue totals are based on confirmed payments; summary rows show billed
                charges against paid and outstanding balances.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExport}
                disabled={data.financial_summary.length === 0}
                className="print:hidden"
              >
                <Download className="h-4 w-4" />
                Export Report
              </Button>
            </div>
          </Card>

          <div className="hidden print:block pt-8 text-center text-xs text-muted border-t border-edge">
            <p className="font-semibold text-fg">
              AriRent Property &amp; Financial Management System
            </p>
            <p className="text-[11px] mt-0.5">
              Report generated on{" "}
              {new Date().toLocaleDateString("en-US", { dateStyle: "long" })}. Confidential
              landlord financial document.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
