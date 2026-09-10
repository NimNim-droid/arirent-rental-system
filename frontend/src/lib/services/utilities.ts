import api from "@/lib/axios";
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
    const res = await api.get<{ data: UtilityReading[] }>("/readings", { params });
    return res.data.data;
  },

  async createReading(payload: ReadingPayload): Promise<UtilityReading> {
    const res = await api.post<{ data: UtilityReading }>("/readings", payload);
    return res.data.data;
  },
};