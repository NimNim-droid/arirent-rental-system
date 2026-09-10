import api from "@/lib/axios";
import type { DashboardStats, TenantDashboardData } from "@/lib/types";

export const dashboardService = {
  async getAdminStats(params?: { property_id?: string }): Promise<DashboardStats> {
    const res = await api.get<{ data: DashboardStats }>("/dashboard/stats", { params });
    return res.data.data;
  },

  async getTenantDashboard(): Promise<TenantDashboardData> {
    const res = await api.get<{ data: TenantDashboardData }>("/tenant/dashboard");
    return res.data.data;
  },
};