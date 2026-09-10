import api from "@/lib/axios";
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
    const res = await api.get<PaginatedResponse<Tenant>>("/tenants", { params });
    return res.data;
  },

  async updateTenant(id: string, payload: TenantUpdatePayload): Promise<Tenant> {
    const res = await api.put<{ data: Tenant }>(`/tenants/${id}`, payload);
    return res.data.data;
  },

  async approveTenant(id: string): Promise<void> {
    await api.post(`/tenants/${id}/approve`);
  },

  async rejectTenant(id: string): Promise<void> {
    await api.post(`/tenants/${id}/reject`);
  },

  async vacateTenant(id: string): Promise<void> {
    await api.post(`/tenants/${id}/vacate`);
  },
};