import api from "@/lib/axios";
import { clientCache } from "@/lib/cache";
import type {
  Inquiry,
  InquiryStatus,
  InquiryStatusCounts,
  PreferredVisitTime,
} from "@/lib/types";

export interface SubmitInquiryPayload {
  property_id: string;
  room_id?: string | null;
  name: string;
  phone: string;
  email?: string;
  preferred_date?: string;
  preferred_time?: PreferredVisitTime | "";
  message?: string;
}

export interface InquiryQuery {
  property_id?: string;
  status?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface UpdateInquiryPayload {
  status?: InquiryStatus;
  scheduled_at?: string | null;
  admin_notes?: string | null;
}

export interface InquiryListResponse {
  data: Inquiry[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    status_counts: InquiryStatusCounts;
  };
}

export const inquiriesService = {
  async submitPublicInquiry(payload: SubmitInquiryPayload): Promise<{ message: string; data: Inquiry }> {
    const body: Record<string, unknown> = {
      property_id: Number(payload.property_id),
      name: payload.name.trim(),
      phone: payload.phone.trim(),
    };
    if (payload.room_id) body.room_id = Number(payload.room_id);
    if (payload.email?.trim()) body.email = payload.email.trim();
    if (payload.preferred_date) body.preferred_date = payload.preferred_date;
    if (payload.preferred_time) body.preferred_time = payload.preferred_time;
    if (payload.message?.trim()) body.message = payload.message.trim();

    const res = await api.post<{ message: string; data: Inquiry }>("/public/inquiries", body);
    clientCache.invalidate("inquiries");
    clientCache.invalidate("dashboard");
    return res.data;
  },

  async getInquiries(params?: InquiryQuery): Promise<InquiryListResponse> {
    const cleanParams: Record<string, string | number> = {};
    if (params?.property_id && params.property_id !== "all") {
      cleanParams.property_id = params.property_id;
    }
    if (params?.status && params.status !== "all") {
      cleanParams.status = params.status;
    }
    if (params?.search?.trim()) {
      cleanParams.search = params.search.trim();
    }
    if (params?.page) cleanParams.page = params.page;
    if (params?.per_page) cleanParams.per_page = params.per_page;

    const res = await api.get<InquiryListResponse>("/inquiries", { params: cleanParams });
    return res.data;
  },

  async updateInquiry(id: string, payload: UpdateInquiryPayload): Promise<Inquiry> {
    const res = await api.put<{ message: string; data: Inquiry }>(`/inquiries/${id}`, payload);
    clientCache.invalidate("inquiries");
    clientCache.invalidate("dashboard");
    return res.data.data;
  },

  async deleteInquiry(id: string): Promise<void> {
    await api.delete(`/inquiries/${id}`);
    clientCache.invalidate("inquiries");
    clientCache.invalidate("dashboard");
  },
};
