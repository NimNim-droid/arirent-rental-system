import { useCallback, useEffect, useMemo, useState } from "react";
import { Banknote, Home, Receipt, Zap } from "lucide-react";
import {
  reportsService,
  type FinancialReportData,
  type RevenuePeriod,
} from "@/lib/services/reports";
import { propertiesService } from "@/lib/services/properties";
import { getErrorMessage } from "@/lib/errors";
import { formatCurrency } from "@/lib/formatters";
import type { Property } from "@/lib/types";
import type { RevenueLineSeries } from "../revenue-line-chart";

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

function csvValue(value: string | number) {
  if (typeof value === "number") {
    return value.toFixed(2);
  }
  return `"${String(value).replace(/"/g, '""')}"`;
}

export function useReports() {
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

  const handleExport = useCallback(() => {
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
  }, [data]);

  const kpis = useMemo(
    () =>
      data
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
        : [],
    [data]
  );

  const lineSeries: RevenueLineSeries[] = useMemo(
    () =>
      data
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
        : [],
    [data]
  );

  const sourceSegments = useMemo(
    () =>
      data
        ? data.revenue_by_source.map((source) => ({
            key: source.key,
            label: source.name,
            value: source.value,
            color: SOURCE_COLORS[source.key] ?? "#94a3b8",
            meta: formatCurrency(source.value),
          }))
        : [],
    [data]
  );

  const paymentSegments = useMemo(
    () =>
      data
        ? data.payment_status.items.map((item) => ({
            key: item.key,
            label: item.name,
            value: item.count,
            color: STATUS_COLORS[item.key] ?? "#94a3b8",
            meta: String(item.count),
          }))
        : [],
    [data]
  );

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

  return {
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
  };
}

