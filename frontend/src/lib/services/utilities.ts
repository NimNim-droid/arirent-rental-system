import api from "@/lib/axios";
import { clientCache } from "@/lib/cache";
import type { UtilityReading } from "@/lib/types";

export interface ReadingQuery {
  tenant_id?: string;
  property_id?: string;
  month?: string;
}

export interface ReadingPayload {
  tenant_id: string;
  prev_reading: number;
  curr_reading: number;
  date: string;
  meter_photo?: File | null;
  meter_photo_url?: string;
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
    let body: FormData | ReadingPayload = payload;
    let headers: Record<string, string> | undefined = undefined;

    if (payload.meter_photo instanceof File) {
      const formData = new FormData();
      formData.append("tenant_id", payload.tenant_id);
      formData.append("prev_reading", String(payload.prev_reading));
      formData.append("curr_reading", String(payload.curr_reading));
      formData.append("date", payload.date);
      formData.append("meter_photo", payload.meter_photo);
      body = formData;
      headers = { "Content-Type": "multipart/form-data" };
    }

    const res = await api.post<{ data: UtilityReading }>("/readings", body, { headers });
    clientCache.invalidate("readings");
    clientCache.invalidate("bills");
    clientCache.invalidate("tenants");
    clientCache.invalidate("dashboard");
    return res.data.data;
  },

  async deleteReading(id: string): Promise<void> {
    await api.delete(`/readings/${id}`);
    clientCache.invalidate("readings");
    clientCache.invalidate("bills");
    clientCache.invalidate("tenants");
    clientCache.invalidate("dashboard");
  },
};