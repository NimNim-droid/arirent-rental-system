import api from "@/lib/axios";
import { clientCache } from "@/lib/cache";
import type { PaginatedResponse, Tenant, TenantUpdatePayload } from "@/lib/types";

export interface TenantQuery {
  status?: string;
  search?: string;
  property_id?: string;
  per_page?: number;
  page?: number;
}

export const tenantsService = {
  async getTenants(params?: TenantQuery): Promise<PaginatedResponse<Tenant>> {
    const cacheKey = `tenants:${JSON.stringify(params || {})}`;
    return clientCache.remember(cacheKey, async () => {
      const res = await api.get<PaginatedResponse<Tenant>>("/tenants", { params });
      return res.data;
    });
  },

  async updateTenant(id: string, payload: TenantUpdatePayload): Promise<Tenant> {
    const res = await api.put<{ data: Tenant }>(`/tenants/${id}`, payload);
    clientCache.invalidate("tenants");
    clientCache.invalidate("dashboard");
    return res.data.data;
  },

  async approveTenant(id: string): Promise<void> {
    await api.post(`/tenants/${id}/approve`);
    clientCache.invalidate("tenants");
    clientCache.invalidate("rooms");
    clientCache.invalidate("properties");
    clientCache.invalidate("dashboard");
  },

  async rejectTenant(id: string): Promise<void> {
    await api.post(`/tenants/${id}/reject`);
    clientCache.invalidate("tenants");
    clientCache.invalidate("rooms");
    clientCache.invalidate("properties");
    clientCache.invalidate("dashboard");
  },

  async vacateTenant(id: string): Promise<void> {
    await api.post(`/tenants/${id}/vacate`);
    clientCache.invalidate("tenants");
    clientCache.invalidate("rooms");
    clientCache.invalidate("properties");
    clientCache.invalidate("dashboard");
  },

  async deleteTenant(id: string): Promise<void> {
    await api.delete(`/tenants/${id}`);
    clientCache.invalidate("tenants");
    clientCache.invalidate("rooms");
    clientCache.invalidate("properties");
    clientCache.invalidate("dashboard");
  },
};