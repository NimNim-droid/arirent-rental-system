import api from "@/lib/axios";
import { clientCache } from "@/lib/cache";
import type { Bill, BillGenerateResult, CreateBillPayload, PaginatedResponse } from "@/lib/types";

export interface BillQuery {
  tenant_id?: string;
  status?: string;
  per_page?: number;
  page?: number;
}

export const billingService = {
  async getBills(params?: BillQuery): Promise<PaginatedResponse<Bill>> {
    const cacheKey = `bills:${JSON.stringify(params || {})}`;
    return clientCache.remember(cacheKey, async () => {
      const res = await api.get<PaginatedResponse<Bill>>("/bills", { params });
      return res.data;
    });
  },

  async getBill(id: string): Promise<Bill> {
    return clientCache.remember(`bill:${id}`, async () => {
      const res = await api.get<{ data: Bill }>(`/bills/${id}`);
      return res.data.data;
    });
  },

  async createBill(payload: CreateBillPayload): Promise<{ message: string; bill: Bill }> {
    const res = await api.post<{ message: string; bill: Bill }>("/bills", payload);
    clientCache.invalidate("bills");
    clientCache.invalidate("tenants");
    clientCache.invalidate("dashboard");
    return res.data;
  },

  async generateBills(payload: { date?: string } = {}): Promise<BillGenerateResult> {
    const res = await api.post<BillGenerateResult>("/bills/generate", payload);
    clientCache.invalidate("bills");
    clientCache.invalidate("tenants");
    clientCache.invalidate("dashboard");
    return res.data;
  },

  async verifyPayment(
    id: string,
    payload: { approved: boolean; reject_reason?: string }
  ): Promise<string> {
    const res = await api.post<{ message: string }>(`/bills/${id}/verify`, payload);
    clientCache.invalidate("bills");
    clientCache.invalidate(`bill:${id}`);
    clientCache.invalidate("tenants");
    clientCache.invalidate("dashboard");
    return res.data.message;
  },

  async updateBill(
    id: string,
    payload: Partial<Pick<Bill, "rent" | "electricity" | "water" | "status">>
  ): Promise<Bill> {
    const res = await api.put<{ data: Bill }>(`/bills/${id}`, payload);
    clientCache.invalidate("bills");
    clientCache.invalidate(`bill:${id}`);
    clientCache.invalidate("tenants");
    clientCache.invalidate("dashboard");
    return res.data.data;
  },

  /**
   * Submits a tenant payment reference for verification.
   */
  async submitPayment(
    id: string,
    payload: { gcash_ref: string; notes?: string; receipt?: File }
  ): Promise<string> {
    const body = new FormData();
    body.append("gcash_ref", payload.gcash_ref);
    if (payload.notes) body.append("notes", payload.notes);
    if (payload.receipt) body.append("receipt", payload.receipt);

    const res = await api.post<{ message: string }>(`/bills/${id}/payment`, body);
    clientCache.invalidate("bills");
    clientCache.invalidate(`bill:${id}`);
    clientCache.invalidate("dashboard");
    return res.data.message;
  },
};