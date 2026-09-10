import api from "@/lib/axios";
import type { Property, Room } from "@/lib/types";

interface RoomQuery {
  property_id?: string;
  status?: string;
}

export const propertiesService = {
  async getProperties(): Promise<Property[]> {
    const res = await api.get<{ data: Property[] }>("/properties");
    return res.data.data;
  },

  async getRooms(params?: RoomQuery): Promise<Room[]> {
    const res = await api.get<{ data: Room[] }>("/rooms", { params });
    return res.data.data;
  },
};