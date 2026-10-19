import api from "@/lib/axios";
import { clientCache } from "@/lib/cache";
import type { UtilityReading } from "@/lib/types";

export interface ReadingQuery {
  tenant_id?: string;
}

export interface ReadingPayload {
  tenant_id: string;
  prev_reading: number;
  curr_reading: number;
  date: string;
}

export const utilitiesService = {
  async getReadings(params?: ReadingQuery): Promise<UtilityReading[]> {
    const cacheKey = `readings:${JSON.stringify(params || {})}`;
    return clientCache.remember(cacheKey, async () => {
      const res = await api.get<{ data: UtilityReading[] }>("/readings", { params });
      return res.data.data;
    });
  },

  async createReading(payload: ReadingPayload): Promise<UtilityReading> {
    const res = await api.post<{ data: UtilityReading }>("/readings", payload);
    clientCache.invalidate("readings");
    clientCache.invalidate("bills");
    clientCache.invalidate("tenants");
    clientCache.invalidate("dashboard");
    return res.data.data;
  },
};