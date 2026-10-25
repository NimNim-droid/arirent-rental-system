import { useState, useEffect, useCallback } from "react";
import { Printer } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { AlertBanner } from "@/components/ui/alert-banner";
import { Button } from "@/components/ui/button";
import { ReportFilters } from "@/components/features/reports/report-filters";
import { KpiSummary } from "@/components/features/reports/kpi-summary";
import { RevenueStreams } from "@/components/features/reports/revenue-streams";
import { SettlementHealth } from "@/components/features/reports/settlement-health";
import { CollectionTrend } from "@/components/features/reports/collection-trend";
import { PropertyPerformance } from "@/components/features/reports/property-performance";
import { reportsService, type FinancialReportData } from "@/lib/services/reports";
import { propertiesService } from "@/lib/services/properties";
import { formatCurrency } from "@/lib/formatters";
import type { Property } from "@/lib/types";

export default function AdminReports() {
  const [data, setData] = useState<FinancialReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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
      setLastUpdated(new Date());
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

  return (
    <div className="space-y-6">
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

      <ReportFilters
        selectedMonth={selectedMonth}
        selectedPropertyId={selectedPropertyId}
        availableMonths={data?.available_months ?? []}
        properties={properties}
        lastUpdated={lastUpdated}
        onMonthChange={setSelectedMonth}
        onPropertyChange={setSelectedPropertyId}
        onReset={resetFilters}
        onRefresh={loadReport}
      />

      <KpiSummary
        kpis={data?.kpis}
        counts={data?.status_counts}
        loading={loading}
        showGrowth={selectedMonth !== "all"}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueStreams streams={data?.revenue_streams} loading={loading} />
        <SettlementHealth counts={data?.status_counts} kpis={data?.kpis} loading={loading} />
      </div>

      <CollectionTrend trend={data?.monthly_trend ?? []} loading={loading} />

      <PropertyPerformance rows={data?.property_performance ?? []} loading={loading} />

      {/* Print footer (only shown when printing) */}
      <div className="hidden print:block pt-8 text-center text-xs text-muted border-t border-edge">
        <p className="font-semibold text-fg">AriRent Property &amp; Financial Management System</p>
        <p className="text-[11px] mt-0.5">
          Report generated on {new Date().toLocaleDateString("en-US", { dateStyle: "long" })}.
          Confidential landlord financial document.
        </p>
      </div>
    </div>
  );
}
