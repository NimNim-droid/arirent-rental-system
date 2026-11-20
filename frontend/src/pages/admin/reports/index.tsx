import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Download,
  Info,
  Printer,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { AlertBanner } from "@/components/ui/alert-banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  useReports,
  RevenueBarChart,
  RevenueLineChart,
  ReportSkeleton,
  ArAging,
  PropertyPerformance,
  type RevenueLineSeries,
} from "@/components/features/reports";
import type { RevenuePeriod } from "@/lib/services/reports";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/cn";

type ChartView = RevenuePeriod | "source";

const CHART_VIEWS: { key: ChartView; label: string }[] = [
  { key: "monthly", label: "Monthly" },
  { key: "source", label: "By Source" },
  { key: "weekly", label: "Weekly" },
  { key: "yearly", label: "Yearly" },
];

const SOURCE_TONE: Record<string, string> = {
  rent: "var(--accent)",
  electricity: "var(--success-fg)",
  water: "var(--warning-fg)",
  other: "#7c3aed",
};

const LINE_TONE: Record<string, string> = {
  rent: "var(--accent)",
  utilities: "var(--success-fg)",
  other: "var(--warning-fg)",
};

const STATUS_TONE: Record<string, string> = {
  paid: "var(--success-fg)",
  partially_paid: "var(--accent)",
  pending: "var(--warning-fg)",
  overdue: "var(--danger-fg)",
};

function renderMoney(value: number, activeClass?: string) {
  if (value <= 0) {
    return <span className="text-faint">—</span>;
  }
  return <span className={activeClass}>{formatCurrency(value)}</span>;
}

export default function AdminReports() {
  const {
    year,
    setYear,
    propertyId,
    setPropertyId,
    data,
    properties,
    loading,
    error,
    yearOptions,
    lineSeries,
    totals,
    loadReport,
    handleExport,
  } = useReports();

  const [chartView, setChartView] = useState<ChartView>("monthly");
  const [showAllMonths, setShowAllMonths] = useState(false);

  const themedLineSeries: RevenueLineSeries[] = useMemo(
    () =>
      lineSeries.map((series) => ({
        ...series,
        color: LINE_TONE[series.key] ?? series.color,
      })),
    [lineSeries]
  );

  const activeSummaryRows = useMemo(
    () =>
      (data?.financial_summary ?? []).filter(
        (row) => row.total_revenue > 0 || row.paid > 0 || row.outstanding > 0
      ),
    [data]
  );

  const displayedRows = useMemo(() => {
    const allRows = data?.financial_summary ?? [];
    if (showAllMonths || activeSummaryRows.length === 0) {
      return allRows;
    }
    return activeSummaryRows;
  }, [data, showAllMonths, activeSummaryRows]);

  const hasEmptyMonths =
    (data?.financial_summary.length ?? 0) > activeSummaryRows.length &&
    activeSummaryRows.length > 0;

  const priorYearValue = useMemo(() => {
    if (!data) return 0;
    const prev = data.revenue_by_period.yearly.find(
      (point) => point.label === String(data.year - 1)
    );
    return prev?.value ?? 0;
  }, [data]);

  const hasPriorYearBaseline = priorYearValue > 0;
  const revenueGrowth = data?.summary.growth.total_revenue ?? 0;
  const paidInvoiceCount =
    data?.payment_status.items.find((item) => item.key === "paid")?.count ?? 0;
  const totalInvoices = data?.payment_status.total ?? 0;
  const sourceTotal = useMemo(
    () =>
      (data?.revenue_by_source ?? []).reduce((sum, item) => sum + Math.max(0, item.value), 0),
    [data]
  );

  const chartSubtitle = useMemo(() => {
    if (!data) return "";
    if (chartView === "weekly") return "Confirmed collections over the last 12 weeks";
    if (chartView === "yearly") return "5-year annual collection comparison";
    if (chartView === "source") return `Monthly trend by charge category · ${data.range_label}`;
    return `Confirmed monthly collections · ${data.range_label}`;
  }, [chartView, data]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial Report"
        subtitle="Collections, receivables, and monthly performance across your portfolio."
        action={
          <div className="flex w-full flex-wrap items-center gap-2 print:hidden sm:w-auto sm:flex-nowrap">
            <div className="w-full sm:w-[172px] sm:shrink-0">
              <Select
                aria-label="Filter by property"
                value={propertyId}
                onChange={(event) => setPropertyId(event.target.value)}
                className="text-xs font-medium"
              >
                <option value="">All Properties</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="relative flex-1 sm:w-[152px] sm:flex-none sm:shrink-0">
              <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              <Select
                aria-label="Report year"
                value={String(year)}
                onChange={(event) => setYear(Number(event.target.value))}
                className="pl-8 text-xs font-medium"
              >
                {yearOptions.map((option) => (
                  <option key={option} value={option}>
                    {`Jan–Dec ${option}`}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <Button
                variant="secondary"
                size="md"
                onClick={loadReport}
                aria-label="Refresh report"
                className="w-8 px-0"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={handleExport}
                disabled={!data || data.financial_summary.length === 0}
                className="text-xs"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export CSV</span>
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => window.print()}
                aria-label="Print report"
                className="text-xs"
              >
                <Printer className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Print</span>
              </Button>
            </div>
          </div>
        }
      />

      {error ? (
        <Card className="p-8 text-center">
          <AlertTriangle className="mx-auto h-7 w-7 text-warning-fg" />
          <p className="mt-3 text-sm font-semibold text-fg">{error}</p>
          <Button variant="secondary" size="md" className="mt-4" onClick={loadReport}>
            <RefreshCw className="h-3.5 w-3.5" />
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

          {/* Executive KPI Strip */}
          <Card className="overflow-hidden">
            <div className="grid grid-cols-1 divide-y divide-edge sm:grid-cols-2 sm:divide-y-0 xl:grid-cols-4 xl:divide-x">
              {/* 1. Collected Revenue */}
              <div className="p-5 sm:border-b sm:border-r xl:border-b-0 xl:border-r-0 border-edge">
                <p className="text-xs font-medium text-muted">Collected Revenue</p>
                <p className="mt-1.5 text-2xl font-semibold tracking-tight text-fg tabular-nums">
                  {formatCurrency(data.summary.total_revenue)}
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted">
                  {hasPriorYearBaseline ? (
                    <>
                      <span
                        className={cn(
                          "inline-flex items-center gap-0.5 font-semibold tabular-nums",
                          revenueGrowth > 0
                            ? "text-success-fg"
                            : revenueGrowth < 0
                            ? "text-danger-fg"
                            : "text-muted"
                        )}
                      >
                        {revenueGrowth > 0 && <ArrowUpRight className="h-3 w-3" />}
                        {revenueGrowth < 0 && <ArrowDownRight className="h-3 w-3" />}
                        {Math.abs(revenueGrowth)}%
                      </span>
                      <span>vs. {data.year - 1}</span>
                    </>
                  ) : (
                    <span>Confirmed payments in {data.year}</span>
                  )}
                </div>
              </div>

              {/* 2. Total Billed */}
              <div className="p-5 sm:border-b xl:border-b-0 border-edge">
                <p className="text-xs font-medium text-muted">Total Billed</p>
                <p className="mt-1.5 text-2xl font-semibold tracking-tight text-fg tabular-nums">
                  {formatCurrency(data.kpis.total_billed)}
                </p>
                <p className="mt-2 text-[11px] text-muted tabular-nums">
                  {totalInvoices} invoice{totalInvoices === 1 ? "" : "s"} issued
                </p>
              </div>

              {/* 3. Outstanding Balance */}
              <div className="p-5 sm:border-r xl:border-r-0 border-edge">
                <p className="text-xs font-medium text-muted">Outstanding Balance</p>
                <p className="mt-1.5 text-2xl font-semibold tracking-tight text-fg tabular-nums">
                  {formatCurrency(data.kpis.total_outstanding)}
                </p>
                <p className="mt-2 text-[11px] text-muted tabular-nums">
                  {data.kpis.overdue_amount > 0 ? (
                    <>
                      <span className="font-semibold text-danger-fg">
                        {formatCurrency(data.kpis.overdue_amount)} overdue
                      </span>
                      <span>
                        {" "}
                        · {data.kpis.overdue_count} late
                      </span>
                    </>
                  ) : data.kpis.total_outstanding > 0 ? (
                    "All open balances are current"
                  ) : (
                    "All invoices settled"
                  )}
                </p>
              </div>

              {/* 4. Collection Rate */}
              <div className="p-5">
                <p className="text-xs font-medium text-muted">Collection Rate</p>
                <div className="mt-1.5 flex items-baseline justify-between gap-2">
                  <p className="text-2xl font-semibold tracking-tight text-fg tabular-nums">
                    {data.kpis.collection_rate.toFixed(1)}%
                  </p>
                  <span className="text-[11px] text-muted tabular-nums">
                    {paidInvoiceCount}/{totalInvoices} paid
                  </span>
                </div>
                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-edge">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      data.kpis.collection_rate >= 90 ? "bg-success-fg" : "bg-accent"
                    )}
                    style={{
                      width: `${Math.min(100, Math.max(0, data.kpis.collection_rate))}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Unified Analytics Row: Performance Chart + Source & Invoice Breakdown */}
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
            <Card className="overflow-hidden xl:col-span-8">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-edge px-5 py-4">
                <div>
                  <h2 className="text-sm font-semibold tracking-tight text-fg">
                    Revenue Performance
                  </h2>
                  <p className="mt-0.5 text-xs text-muted">{chartSubtitle}</p>
                </div>

                <div
                  role="group"
                  aria-label="Revenue chart view"
                  className="inline-flex items-center rounded-lg border border-edge bg-inset p-0.5 print:hidden"
                >
                  {CHART_VIEWS.map((option) => {
                    const active = chartView === option.key;
                    return (
                      <button
                        key={option.key}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setChartView(option.key)}
                        className={cn(
                          "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer",
                          active
                            ? "bg-card text-fg shadow-soft"
                            : "text-muted hover:text-fg"
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="px-4 py-4 sm:px-5">
                {chartView === "source" ? (
                  <>
                    <div className="mb-3 flex flex-wrap items-center justify-end gap-4">
                      {themedLineSeries.map((series) => {
                        const hasActivity = series.values.some((v) => v > 0);
                        return (
                          <span
                            key={series.key}
                            className={cn(
                              "flex items-center gap-1.5 text-[11px] font-medium",
                              hasActivity ? "text-fg-soft" : "text-faint"
                            )}
                          >
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: series.color }}
                            />
                            {series.label}
                          </span>
                        );
                      })}
                    </div>
                    <RevenueLineChart
                      labels={data.revenue_overview.map((point) => point.month)}
                      series={themedLineSeries}
                    />
                  </>
                ) : (
                  <RevenueBarChart points={data.revenue_by_period[chartView]} />
                )}
              </div>
            </Card>

            {/* Right Panel: Revenue by Source + Invoice Status */}
            <Card className="flex flex-col overflow-hidden xl:col-span-4">
              {/* Revenue by Source */}
              <div className="p-5">
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="text-sm font-semibold tracking-tight text-fg">
                    Revenue by Source
                  </h2>
                  <span className="text-xs font-semibold text-fg tabular-nums">
                    {formatCurrency(data.summary.total_revenue)}
                  </span>
                </div>

                <div
                  className="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-edge gap-px"
                  aria-hidden="true"
                >
                  {sourceTotal > 0 &&
                    data.revenue_by_source
                      .filter((source) => source.value > 0)
                      .map((source) => (
                        <div
                          key={source.key}
                          style={{
                            width: `${(source.value / sourceTotal) * 100}%`,
                            backgroundColor: SOURCE_TONE[source.key] ?? "var(--muted)",
                          }}
                          title={`${source.name}: ${formatCurrency(source.value)}`}
                        />
                      ))}
                </div>

                <ul className="mt-4 space-y-2.5">
                  {data.revenue_by_source.map((source) => {
                    const share =
                      sourceTotal > 0 ? (source.value / sourceTotal) * 100 : 0;
                    const active = source.value > 0;
                    return (
                      <li
                        key={source.key}
                        className="flex items-center justify-between gap-3 text-xs"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{
                              backgroundColor: active
                                ? SOURCE_TONE[source.key] ?? "var(--muted)"
                                : "var(--edge-strong)",
                            }}
                          />
                          <span
                            className={cn(
                              "truncate",
                              active ? "font-medium text-fg-soft" : "text-muted"
                            )}
                          >
                            {source.name}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-3 tabular-nums">
                          <span
                            className={cn(
                              active ? "font-medium text-fg" : "text-faint"
                            )}
                          >
                            {active ? formatCurrency(source.value) : "—"}
                          </span>
                          <span className="w-10 text-right text-[11px] text-muted">
                            {share.toFixed(1)}%
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Invoice Status Breakdown */}
              <div className="flex-1 border-t border-edge p-5">
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="text-sm font-semibold tracking-tight text-fg">
                    Invoice Status
                  </h2>
                  <span className="text-xs text-muted tabular-nums">
                    {totalInvoices} total
                  </span>
                </div>

                <div
                  className="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-edge gap-px"
                  aria-hidden="true"
                >
                  {totalInvoices > 0 &&
                    data.payment_status.items
                      .filter((item) => item.count > 0)
                      .map((item) => (
                        <div
                          key={item.key}
                          style={{
                            width: `${(item.count / totalInvoices) * 100}%`,
                            backgroundColor: STATUS_TONE[item.key] ?? "var(--muted)",
                          }}
                          title={`${item.name}: ${item.count} invoice(s)`}
                        />
                      ))}
                </div>

                <ul className="mt-4 space-y-2.5">
                  {data.payment_status.items.map((item) => {
                    const active = item.count > 0 || item.amount > 0;
                    return (
                      <li
                        key={item.key}
                        className="flex items-center justify-between gap-3 text-xs"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{
                              backgroundColor: active
                                ? STATUS_TONE[item.key] ?? "var(--muted)"
                                : "var(--edge-strong)",
                            }}
                          />
                          <span
                            className={cn(
                              "truncate",
                              active ? "font-medium text-fg-soft" : "text-muted"
                            )}
                          >
                            {item.name}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-3 tabular-nums">
                          <span
                            className={cn(
                              active ? "font-medium text-fg" : "text-faint"
                            )}
                          >
                            {item.amount > 0 ? formatCurrency(item.amount) : "—"}
                          </span>
                          <span className="w-8 text-right text-[11px] text-muted">
                            {item.count}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </Card>
          </div>

          {/* Accounts Receivable Aging Analysis */}
          {data.ar_aging && (
            <ArAging aging={data.ar_aging} loading={loading} />
          )}

          {/* Building & Property Financial Performance */}
          {data.property_performance && data.property_performance.length > 0 && (
            <PropertyPerformance rows={data.property_performance} loading={loading} />
          )}

          {/* Monthly Financial Statement */}
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-edge px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold tracking-tight text-fg">
                  Monthly Financial Statement
                </h2>
                <p className="mt-0.5 text-xs text-muted">{data.range_label}</p>
              </div>

              {hasEmptyMonths && (
                <div
                  role="group"
                  aria-label="Statement month filter"
                  className="inline-flex items-center rounded-lg border border-edge bg-inset p-0.5 print:hidden"
                >
                  <button
                    type="button"
                    aria-pressed={!showAllMonths}
                    onClick={() => setShowAllMonths(false)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer",
                      !showAllMonths
                        ? "bg-card text-fg shadow-soft"
                        : "text-muted hover:text-fg"
                    )}
                  >
                    Active ({activeSummaryRows.length})
                  </button>
                  <button
                    type="button"
                    aria-pressed={showAllMonths}
                    onClick={() => setShowAllMonths(true)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer",
                      showAllMonths
                        ? "bg-card text-fg shadow-soft"
                        : "text-muted hover:text-fg"
                    )}
                  >
                    All 12 Months
                  </button>
                </div>
              )}
            </div>

            {data.financial_summary.length === 0 ? (
              <EmptyState
                icon={<BarChart3 className="h-4 w-4" />}
                title="No financial activity for this year"
                description="Generate invoices or record payments to populate this statement."
              />
            ) : (
              <div className="table-scroll-wrap overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[132px]">Period</TableHead>
                      <TableHead className="text-right">Billed</TableHead>
                      <TableHead className="text-right">Rent</TableHead>
                      <TableHead className="text-right">Utilities</TableHead>
                      <TableHead className="text-right">Other</TableHead>
                      <TableHead className="text-right">Collected</TableHead>
                      <TableHead className="text-right">Pending</TableHead>
                      <TableHead className="text-right">Partial</TableHead>
                      <TableHead className="text-right">Overdue</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedRows.map((row) => {
                      const hasActivity =
                        row.total_revenue > 0 || row.paid > 0 || row.outstanding > 0;
                      return (
                        <TableRow key={row.period}>
                          <TableCell
                            className={cn(
                              "whitespace-nowrap text-xs",
                              hasActivity ? "font-semibold text-fg" : "text-muted"
                            )}
                          >
                            {row.period}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right text-xs tabular-nums">
                            {renderMoney(row.total_revenue, "font-semibold text-fg")}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right text-xs tabular-nums">
                            {renderMoney(row.total_rent, "text-fg-soft")}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right text-xs tabular-nums">
                            {renderMoney(row.total_utilities, "text-fg-soft")}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right text-xs tabular-nums">
                            {renderMoney(row.total_other, "text-fg-soft")}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right text-xs tabular-nums">
                            {renderMoney(row.paid, "font-medium text-success-fg")}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right text-xs tabular-nums">
                            {renderMoney(row.pending, "font-medium text-warning-fg")}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right text-xs tabular-nums">
                            {renderMoney(row.partially_paid, "text-fg-soft")}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right text-xs tabular-nums">
                            {renderMoney(row.overdue, "font-medium text-danger-fg")}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right text-xs tabular-nums">
                            {renderMoney(row.outstanding, "font-semibold text-fg")}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  {totals && (
                    <tfoot>
                      <tr className="border-t-2 border-edge bg-inset/70 text-xs font-semibold text-fg">
                        <td className="whitespace-nowrap px-4 py-3">Total</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                          {formatCurrency(totals.total_revenue)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                          {renderMoney(totals.total_rent)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                          {renderMoney(totals.total_utilities)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                          {renderMoney(totals.total_other)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right text-success-fg tabular-nums">
                          {formatCurrency(totals.paid)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                          {renderMoney(totals.pending, "text-warning-fg")}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                          {renderMoney(totals.partially_paid)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                          {renderMoney(totals.overdue, "text-danger-fg")}
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

            <div className="border-t border-edge px-5 py-3">
              <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Collected revenue reflects confirmed payments. Monthly rows show billed
                charges against collected and remaining balances.
              </p>
            </div>
          </Card>

          <div className="hidden border-t border-edge pt-8 text-center text-xs text-muted print:block">
            <p className="font-semibold text-fg">
              AriRent Property &amp; Financial Management System
            </p>
            <p className="mt-0.5 text-[11px]">
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
