import type { PublicProperty, PublicRoom } from "@/lib/types";

export type ListingQuickMode = "all" | "vacant" | "solo" | "shared";

export interface FeaturedPublicRoom {
  room: PublicRoom;
  propertyId: string;
  propertyName: string;
  propertyCity: string;
  propertyAddress: string;
  previewPhotoUrl: string | null;
}

export interface PublicListingTotals {
  totalBuildings: number;
  totalVacant: number;
  totalListedRooms: number;
  citiesCount: number;
}

export interface PrimaryLandlordContact {
  propertyId: string;
  propertyName: string;
  contactName: string;
  contactPhone: string | null;
  contactEmail: string | null;
  messengerUrl: string | null;
  address: string;
  city: string;
}

/**
 * Ensures user-entered external links (e.g. Messenger URLs) carry a valid http(s) scheme.
 */
export function normalizeExternalUrl(raw?: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/**
 * Strips formatting spaces/punctuation for tel: and sms: links.
 */
export function sanitizePhoneHref(phone?: string | null): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/[^0-9+]/g, "");
  return cleaned.length > 0 ? cleaned : null;
}

/**
 * Applies the quick discovery tab filter on top of API-filtered listings.
 */
export function filterPropertiesByQuickMode(
  properties: PublicProperty[],
  mode: ListingQuickMode
): PublicProperty[] {
  if (mode === "all") return properties;

  if (mode === "vacant") {
    return properties.filter((property) => property.available_rooms_count > 0);
  }

  if (mode === "solo") {
    return properties.filter((property) =>
      property.rooms.some((room) => room.is_available && room.capacity === 1)
    );
  }

  return properties.filter((property) =>
    property.rooms.some((room) => room.is_available && room.capacity >= 2)
  );
}

/**
 * Flattens available rooms across loaded buildings and ranks them with photos first,
 * then by lowest monthly rent so visitors immediately see actionable vacant units.
 */
export function extractFeaturedVacantRooms(
  properties: PublicProperty[],
  limit = 6
): FeaturedPublicRoom[] {
  const candidates: FeaturedPublicRoom[] = [];

  for (const property of properties) {
    for (const room of property.rooms) {
      if (!room.is_available) continue;
      candidates.push({
        room,
        propertyId: property.id,
        propertyName: property.name,
        propertyCity: property.city,
        propertyAddress: property.address,
        previewPhotoUrl: room.cover_photo_url || property.cover_photo_url || null,
      });
    }
  }

  candidates.sort((a, b) => {
    const photoDelta = Number(Boolean(b.previewPhotoUrl)) - Number(Boolean(a.previewPhotoUrl));
    if (photoDelta !== 0) return photoDelta;
    return a.room.rent - b.room.rent;
  });

  return candidates.slice(0, limit);
}

/**
 * Computes honest real-time inventory metrics directly from published listings.
 */
export function computeListingTotals(
  properties: PublicProperty[],
  citiesCount: number
): PublicListingTotals {
  let totalVacant = 0;
  let totalListedRooms = 0;

  for (const property of properties) {
    totalVacant += property.available_rooms_count || 0;
    totalListedRooms += property.listed_rooms_count || property.rooms.length;
  }

  return {
    totalBuildings: properties.length,
    totalVacant,
    totalListedRooms,
    citiesCount,
  };
}

/**
 * Picks the primary public management contact configured across published buildings.
 */
export function extractPrimaryLandlordContact(
  properties: PublicProperty[]
): PrimaryLandlordContact | null {
  if (properties.length === 0) return null;

  const withContact =
    properties.find(
      (property) =>
        Boolean(property.contact_phone) ||
        Boolean(property.contact_email) ||
        Boolean(property.messenger_url)
    ) ?? properties[0];

  return {
    propertyId: withContact.id,
    propertyName: withContact.name,
    contactName: withContact.contact_name || "AriRent Leasing Office",
    contactPhone: withContact.contact_phone || null,
    contactEmail: withContact.contact_email || null,
    messengerUrl: normalizeExternalUrl(withContact.messenger_url),
    address: withContact.address,
    city: withContact.city,
  };
}
