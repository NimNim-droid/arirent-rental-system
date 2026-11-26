import api from "@/lib/axios";
import { clientCache } from "@/lib/cache";
import { compressImage } from "@/lib/image";
import type {
  ListingPhoto,
  Property,
  PublicProperty,
  PublicRoom,
} from "@/lib/types";

export interface PublicListingFilters {
  q?: string;
  city?: string;
  min_rent?: number;
  max_rent?: number;
  capacity?: number;
}

export interface PublicListingsResult {
  data: PublicProperty[];
  meta: {
    cities: string[];
    total: number;
  };
}

function invalidateListingCaches(): void {
  clientCache.invalidate("listings");
  clientCache.invalidate("properties");
  clientCache.invalidate("rooms");
}

export const listingsService = {
  async getPublicListings(filters?: PublicListingFilters): Promise<PublicListingsResult> {
    const params: Record<string, string | number> = {};
    if (filters?.q?.trim()) params.q = filters.q.trim();
    if (filters?.city && filters.city !== "all") params.city = filters.city;
    if (filters?.min_rent !== undefined && filters.min_rent > 0) params.min_rent = filters.min_rent;
    if (filters?.max_rent !== undefined && filters.max_rent > 0) params.max_rent = filters.max_rent;
    if (filters?.capacity !== undefined && filters.capacity > 0) params.capacity = filters.capacity;

    const cacheKey = `listings:public:${JSON.stringify(params)}`;
    return clientCache.remember(
      cacheKey,
      async () => {
        const res = await api.get<PublicListingsResult>("/public/listings", { params });
        return res.data;
      },
      20_000
    );
  },

  async getPublicProperty(id: string): Promise<PublicProperty> {
    return clientCache.remember(
      `listings:property:${id}`,
      async () => {
        const res = await api.get<{ data: PublicProperty }>(`/public/listings/${id}`);
        return res.data.data;
      },
      20_000
    );
  },

  async getPublicRoom(id: string): Promise<PublicRoom> {
    return clientCache.remember(
      `listings:room:${id}`,
      async () => {
        const res = await api.get<{ data: PublicRoom }>(`/public/rooms/${id}`);
        return res.data.data;
      },
      15_000
    );
  },

  async getAdminPropertyListing(propertyId: string): Promise<Property> {
    const res = await api.get<{ data: Property }>(`/properties/${propertyId}/listing`);
    return res.data.data;
  },

  async uploadPhotos(
    propertyId: string,
    files: File[],
    roomId?: string | null
  ): Promise<ListingPhoto[]> {
    const compressed = await Promise.all(
      files.map((file) => compressImage(file, 1600, 1600, 0.82))
    );

    const formData = new FormData();
    if (roomId) {
      formData.append("room_id", roomId);
    }
    compressed.forEach((file) => {
      formData.append("photos[]", file);
    });

    const res = await api.post<{ message: string; data: ListingPhoto[] }>(
      `/properties/${propertyId}/photos`,
      formData
    );
    invalidateListingCaches();
    return res.data.data;
  },

  async setCoverPhoto(photoId: string): Promise<ListingPhoto> {
    const res = await api.post<{ message: string; data: ListingPhoto }>(
      `/listing-photos/${photoId}/cover`
    );
    invalidateListingCaches();
    return res.data.data;
  },

  async deletePhoto(photoId: string): Promise<void> {
    await api.delete(`/listing-photos/${photoId}`);
    invalidateListingCaches();
  },
};
