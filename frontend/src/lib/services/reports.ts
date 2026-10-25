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

export interface FinancialReportData {
  period: string;
  property_id: number | null;
  kpis: FinancialKpis;
  reconciliation: PaymentReconciliation;
  revenue_streams: RevenueStreams;
  status_counts: PaymentStatusCounts;
  property_performance: PropertyPerformance[];
  monthly_trend: MonthlyTrendItem[];
  available_months: string[];
}

export interface FinancialReportParams {
  month?: string;
  property_id?: string | number;
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

    const queryString = query.toString();
    const url = `/reports/financial${queryString ? `?${queryString}` : ""}`;
    const res = await api.get<{ data: FinancialReportData }>(url);
    return res.data.data;
  },
};
