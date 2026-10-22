import api from "@/lib/axios";
import { clientCache } from "@/lib/cache";
import type { ExcessCharge } from "@/lib/types";

export const excessChargesService = {
  async getCharges(params?: { tenant_id?: string; status?: string }): Promise<ExcessCharge[]> {
    const cacheKey = `excess_charges:${JSON.stringify(params || {})}`;
    return clientCache.remember(cacheKey, async () => {
      const res = await api.get<{ data: ExcessCharge[] }>("/excess-charges", { params });
      return res.data.data;
    });
  },

  async createCharge(payload: {
    tenant_id: string;
    title: string;
    description?: string;
    amount: number;
    charge_date: string;
  }): Promise<ExcessCharge> {
    const res = await api.post<{ message: string; data: ExcessCharge }>("/excess-charges", payload);
    clientCache.invalidate("excess_charges");
    clientCache.invalidate("bills");
    return res.data.data;
  },

  async deleteCharge(id: string): Promise<void> {
    await api.delete(`/excess-charges/${id}`);
    clientCache.invalidate("excess_charges");
    clientCache.invalidate("bills");
  },
};
