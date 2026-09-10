import api from "@/lib/axios";
import type {
  MaintenanceInput,
  MaintenanceTicket,
  PaginatedResponse,
} from "@/lib/types";

export interface TicketQuery {
  tenant_id?: string;
  status?: string;
  property_id?: string;
  per_page?: number;
  page?: number;
}

export interface TicketUpdatePayload {
  status?: MaintenanceTicket["status"];
  technician_name?: string;
  admin_notes?: string;
}

export const maintenanceService = {
  async getTickets(params?: TicketQuery): Promise<PaginatedResponse<MaintenanceTicket>> {
    const res = await api.get<PaginatedResponse<MaintenanceTicket>>("/maintenance", { params });
    return res.data;
  },

  async createTicket(payload: MaintenanceInput): Promise<MaintenanceTicket> {
    const res = await api.post<{ data: MaintenanceTicket }>("/maintenance", payload);
    return res.data.data;
  },

  async updateTicket(id: string, payload: TicketUpdatePayload): Promise<MaintenanceTicket> {
    const res = await api.put<{ data: MaintenanceTicket }>(`/maintenance/${id}`, payload);
    return res.data.data;
  },

  async dispatchTicket(
    id: string,
    payload: { technician_name: string; admin_notes?: string }
  ): Promise<MaintenanceTicket> {
    return this.updateTicket(id, {
      status: "in_progress",
      technician_name: payload.technician_name,
      admin_notes: payload.admin_notes,
    });
  },

  async resolveTicket(id: string): Promise<MaintenanceTicket> {
    return this.updateTicket(id, { status: "resolved" });
  },
};