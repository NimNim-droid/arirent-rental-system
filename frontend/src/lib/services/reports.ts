import api from "@/lib/axios";

export interface FinancialKpis {
  total_billed: number;
  total_collected: number;
  total_outstanding: number;
  collection_rate: number;
  previous_month_collected: number;
  growth_rate: number;
  /** Remaining balance on unpaid/partial invoices whose due date has passed. */
  overdue_amount: number;
  overdue_count: number;
}

/** Bill-level paid_amount compared with confirmed rows in the payments ledger. */
export interface PaymentReconciliation {
  recorded_paid_amount: number;
  confirmed_payments: number;
  difference: number;
  is_reconciled: boolean;
}

export interface RevenueStreamDetail {
  amount: number;
  percentage: number;
}

export interface RevenueStreams {
  rent: RevenueStreamDetail;
  electricity: RevenueStreamDetail;
  water: RevenueStreamDetail;
  excess_charges: RevenueStreamDetail;
  late_fees: RevenueStreamDetail;
}

export interface PaymentStatusCounts {
  paid: number;
  partially_paid: number;
  unpaid: number;
  overdue: number;
  pending_verification: number;
  total_bills: number;
}

export interface PropertyPerformance {
  property_id: string;
  property_name: string;
  city: string;
  total_units: number;
  occupied_units: number;
  occupancy_rate: number;
  billed_amount: number;
  collected_amount: number;
  outstanding_amount: number;
  collection_rate: number;
  bill_count: number;
}

export interface MonthlyTrendItem {
  month: string;
  label: string;
  billed: number;
  collected: number;
  outstanding: number;
}

export type ArAgingBucketKey = "current" | "1_30" | "31_60" | "61_90" | "over_90";

export interface ArAgingBucket {
  key: ArAgingBucketKey;
  label: string;
  bill_count: number;
  amount: number;
}

export interface ArAgingItem {
  bill_id: number;
  tenant_id: number;
  tenant_name: string;
  room: string | null;
  property_name: string | null;
  status: "unpaid" | "partially_paid";
  due_date: string | null;
  days_past_due: number;
  remaining_balance: number;
  bucket: ArAgingBucketKey;
}

/** Unpaid balances grouped by days past due, as of today. Not affected by the Month filter. */
export interface ArAging {
  as_of: string;
  total_outstanding: number;
  buckets: ArAgingBucket[];
  items: ArAgingItem[];
}

export type RevenuePeriod = "weekly" | "monthly" | "yearly";

export interface FinancialReportSummary {
  total_revenue: number;
  total_rent: number;
  total_utilities: number;
  total_other: number;
  growth: {
    total_revenue: number;
    total_rent: number;
    total_utilities: number;
    total_other: number;
  };
}

export interface RevenueOverviewPoint {
  month: string;
  rent: number;
  utilities: number;
  other: number;
  total: number;
}

export interface RevenueSource {
  key: "rent" | "electricity" | "water" | "other";
  name: string;
  value: number;
}

export interface RevenuePeriodPoint {
  label: string;
  value: number;
}

export interface PaymentStatusItem {
  key: "paid" | "pending" | "partially_paid" | "overdue";
  name: string;
  count: number;
  amount: number;
}

export interface FinancialSummaryRow {
  month: number;
  period: string;
  total_revenue: number;
  total_rent: number;
  total_utilities: number;
  total_other: number;
  paid: number;
  pending: number;
  partially_paid: number;
  overdue: number;
  outstanding: number;
}

export interface FinancialReportData {
  period: string;
  property_id: number | null;
  kpis: FinancialKpis;
  reconciliation: PaymentReconciliation;
  revenue_streams: RevenueStreams;
  status_counts: PaymentStatusCounts;
  property_performance: PropertyPerformance[];
  monthly_trend: MonthlyTrendItem[];
  ar_aging: ArAging;
  available_months: string[];
  year: number;
  range_label: string;
  summary: FinancialReportSummary;
  revenue_overview: RevenueOverviewPoint[];
  revenue_by_source: RevenueSource[];
  revenue_by_period: Record<RevenuePeriod, RevenuePeriodPoint[]>;
  payment_status: {
    total: number;
    items: PaymentStatusItem[];
  };
  financial_summary: FinancialSummaryRow[];
  available_years: number[];
}

export interface FinancialReportParams {
  month?: string;
  property_id?: string | number;
  year?: number;
}

export const reportsService = {
  async getFinancialReport(params?: FinancialReportParams): Promise<FinancialReportData> {
    const query = new URLSearchParams();
    if (params?.month && params.month !== "all") {
      query.append("month", params.month);
    }
    if (params?.property_id && params.property_id !== "all") {
      query.append("property_id", String(params.property_id));
    }
    if (params?.year) {
      query.append("year", String(params.year));
    }

    const queryString = query.toString();
    const url = `/reports/financial${queryString ? `?${queryString}` : ""}`;
    const res = await api.get<{ data: FinancialReportData }>(url);
    return res.data.data;
  },
};
