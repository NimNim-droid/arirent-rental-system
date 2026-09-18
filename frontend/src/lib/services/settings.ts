import api from "@/lib/axios";
import { clientCache } from "@/lib/cache";
import type { Settings } from "@/lib/types";

export const settingsService = {
  async getSettings(): Promise<Settings> {
    return clientCache.remember("settings:global", async () => {
      const res = await api.get<{ data: Settings }>("/settings");
      return res.data.data;
    });
  },

  async updateSettings(payload: Partial<Settings>): Promise<Settings> {
    const res = await api.put<{ data: Settings }>("/settings", payload);
    clientCache.invalidate("settings");
    clientCache.invalidate("dashboard");
    return res.data.data;
  },
};