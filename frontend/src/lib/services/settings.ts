import api from "@/lib/axios";
import type { Settings } from "@/lib/types";

export const settingsService = {
  async getSettings(): Promise<Settings> {
    const res = await api.get<{ data: Settings }>("/settings");
    return res.data.data;
  },

  async updateSettings(payload: Partial<Settings>): Promise<Settings> {
    const res = await api.put<{ data: Settings }>("/settings", payload);
    return res.data.data;
  },
};