import {
  AlertTriangle,
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
  DonutChart,
  RevenueBarChart,
  RevenueLineChart,
  KpiCard,
  ReportSkeleton,
  ArAging,
  PropertyPerformance,
} from "@/components/features/reports";
import type { RevenuePeriod } from "@/lib/services/reports";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/cn";

const PERIOD_OPTIONS: { key: RevenuePeriod; label: string }[] = [
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "yearly", label: "Yearly" },
];

export default function AdminReports() {
  const {
    year,
    setYear,
    propertyId,
    setPropertyId,
    period,
    setPeriod,
    data,
    properties,
    loading,
    error,
    yearOptions,
    kpis,
    lineSeries,
    sourceSegments,
    paymentSegments,
    totals,
    loadReport,
    handleExport,
  } = useReports();

  return (
    <div className="space-y-6">
      <PageHeader
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

          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((kpi) => (
              <KpiCard key={kpi.title} {...kpi} />
            ))}
          </div>

          {/* Revenue Overview & Source Breakdowns */}
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

          {/* Revenue by Period & Payment Status */}
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

          {/* Accounts Receivable Aging Analysis */}
          {data.ar_aging && (
            <ArAging aging={data.ar_aging} loading={loading} />
          )}

          {/* Building & Property Financial Performance */}
          {data.property_performance && data.property_performance.length > 0 && (
            <PropertyPerformance rows={data.property_performance} loading={loading} />
          )}

          {/* Full Financial Summary Table */}
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
                icon={<BarChart3 className="h-4 w-4" />}
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
