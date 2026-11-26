import api from "@/lib/axios";
import { clientCache } from "@/lib/cache";
import type { Property, Room } from "@/lib/types";

interface RoomQuery {
  property_id?: string;
  status?: string;
  is_listed?: boolean;
}

export interface CreatePropertyData {
  name: string;
  city: string;
  address: string;
  description?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  messenger_url?: string | null;
  house_rules?: string | null;
  amenities?: string[];
}

export interface CreateRoomData {
  property_id: string;
  room_number: string;
  rent: number;
  status?: "vacant" | "reserved" | "occupied";
  description?: string | null;
  capacity?: number;
  floor_area?: number | null;
  amenities?: string[];
  advance_months?: number;
  deposit_months?: number;
  is_listed?: boolean;
}

export type UpdateRoomData = Partial<Omit<CreateRoomData, "property_id">>;

function invalidatePropertyCaches(): void {
  clientCache.invalidate("properties");
  clientCache.invalidate("rooms");
  clientCache.invalidate("listings");
  clientCache.invalidate("dashboard");
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
    invalidatePropertyCaches();
    return res.data.data;
  },

  async updateProperty(id: string, data: Partial<CreatePropertyData>): Promise<Property> {
    const res = await api.put<{ message: string; data: Property }>(`/properties/${id}`, data);
    invalidatePropertyCaches();
    return res.data.data;
  },

  async deleteProperty(id: string): Promise<void> {
    await api.delete(`/properties/${id}`);
    invalidatePropertyCaches();
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
    invalidatePropertyCaches();
    return res.data.data;
  },

  async updateRoom(id: string, data: UpdateRoomData): Promise<Room> {
    const res = await api.put<{ message: string; data: Room }>(`/rooms/${id}`, data);
    invalidatePropertyCaches();
    return res.data.data;
  },

  async deleteRoom(id: string): Promise<void> {
    await api.delete(`/rooms/${id}`);
    invalidatePropertyCaches();
  },
};
