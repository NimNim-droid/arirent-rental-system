import api from "@/lib/axios";
import { clientCache } from "@/lib/cache";
import type { Property, Room } from "@/lib/types";

interface RoomQuery {
  property_id?: string;
  status?: string;
}

export interface CreatePropertyData {
  name: string;
  city: string;
  address: string;
}

export interface CreateRoomData {
  property_id: string;
  room_number: string;
  rent: number;
  status?: "vacant" | "reserved" | "occupied";
}

export const propertiesService = {
  async getProperties(): Promise<Property[]> {
    return clientCache.remember("properties:all", async () => {
      const res = await api.get<{ data: Property[] }>("/properties");
      return res.data.data;
    });
  },

  async createProperty(data: CreatePropertyData): Promise<Property> {
    const res = await api.post<{ message: string; data: Property }>("/properties", data);
    clientCache.invalidate("properties");
    clientCache.invalidate("rooms");
    clientCache.invalidate("dashboard");
    return res.data.data;
  },

  async updateProperty(id: string, data: Partial<CreatePropertyData>): Promise<Property> {
    const res = await api.put<{ message: string; data: Property }>(`/properties/${id}`, data);
    clientCache.invalidate("properties");
    clientCache.invalidate("rooms");
    clientCache.invalidate("dashboard");
    return res.data.data;
  },

  async deleteProperty(id: string): Promise<void> {
    await api.delete(`/properties/${id}`);
    clientCache.invalidate("properties");
    clientCache.invalidate("rooms");
    clientCache.invalidate("dashboard");
  },

  async getRooms(params?: RoomQuery): Promise<Room[]> {
    const cacheKey = `rooms:${JSON.stringify(params || {})}`;
    return clientCache.remember(cacheKey, async () => {
      const res = await api.get<{ data: Room[] }>("/rooms", { params });
      return res.data.data;
    });
  },

  async createRoom(data: CreateRoomData): Promise<Room> {
    const res = await api.post<{ message: string; data: Room }>("/rooms", data);
    clientCache.invalidate("rooms");
    clientCache.invalidate("properties");
    clientCache.invalidate("dashboard");
    return res.data.data;
  },

  async updateRoom(id: string, data: Partial<{ room_number: string; rent: number; status: string }>): Promise<Room> {
    const res = await api.put<{ message: string; data: Room }>(`/rooms/${id}`, data);
    clientCache.invalidate("rooms");
    clientCache.invalidate("properties");
    clientCache.invalidate("dashboard");
    return res.data.data;
  },

  async deleteRoom(id: string): Promise<void> {
    await api.delete(`/rooms/${id}`);
    clientCache.invalidate("rooms");
    clientCache.invalidate("properties");
    clientCache.invalidate("dashboard");
  },
};