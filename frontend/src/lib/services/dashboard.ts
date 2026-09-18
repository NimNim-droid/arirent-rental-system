import api from "@/lib/axios";
import { clientCache } from "@/lib/cache";
import type { DashboardStats, TenantDashboardData } from "@/lib/types";

export const dashboardService = {
  async getAdminStats(params?: { property_id?: string }): Promise<DashboardStats> {
    const cacheKey = `dashboard:admin:${params?.property_id || "all"}`;
    return clientCache.remember(cacheKey, async () => {
      const res = await api.get<{ data: DashboardStats }>("/dashboard/stats", { params });
      return res.data.data;
    }, 60_000);
  },

  async getTenantDashboard(): Promise<TenantDashboardData> {
    return clientCache.remember("dashboard:tenant", async () => {
      const res = await api.get<{ data: TenantDashboardData }>("/tenant/dashboard");
      return res.data.data;
    }, 60_000);
  },
};