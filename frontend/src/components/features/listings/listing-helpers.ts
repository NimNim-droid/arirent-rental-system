import type { PublicProperty, PublicRoom } from "@/lib/types";

export type ListingQuickMode = "all" | "vacant" | "solo" | "shared";
export type PublicCatalogTab = "buildings" | "rooms";

export const RENT_BUDGET_OPTIONS = [
  { label: "Any monthly budget", value: "" },
  { label: "Up to ₱6,000 / mo", value: "6000" },
  { label: "Up to ₱9,000 / mo", value: "9000" },
  { label: "Up to ₱12,000 / mo", value: "12000" },
  { label: "Up to ₱15,000 / mo", value: "15000" },
  { label: "Up to ₱20,000 / mo", value: "20000" },
] as const;

export const OCCUPANCY_OPTIONS = [
  { label: "Any capacity", value: "" },
  { label: "Solo (1+ person)", value: "1" },
  { label: "2+ occupants", value: "2" },
  { label: "3+ occupants", value: "3" },
] as const;

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

export interface ListingFilterSnapshot {
  quickMode: ListingQuickMode;
  searchInput: string;
  city: string;
  maxRent: string;
  capacity: string;
}

const VALID_QUICK_MODES = new Set<ListingQuickMode>(["all", "vacant", "solo", "shared"]);

export function parseQuickModeParam(value: string | null): ListingQuickMode {
  if (value && VALID_QUICK_MODES.has(value as ListingQuickMode)) {
    return value as ListingQuickMode;
  }
  return "all";
}

export function parseCatalogTabParam(value: string | null): PublicCatalogTab {
  return value === "rooms" ? "rooms" : "buildings";
}

/**
 * Builds a clean /properties catalog link preserving only active filters.
 */
export function buildPropertiesCatalogUrl(params: {
  q?: string;
  mode?: ListingQuickMode;
  city?: string;
  maxRent?: string;
  capacity?: string;
  tab?: PublicCatalogTab;
}): string {
  const search = new URLSearchParams();
  if (params.q?.trim()) search.set("q", params.q.trim());
  if (params.mode && params.mode !== "all") search.set("mode", params.mode);
  if (params.city && params.city !== "all") search.set("city", params.city);
  if (params.maxRent) search.set("max_rent", params.maxRent);
  if (params.capacity) search.set("capacity", params.capacity);
  if (params.tab && params.tab !== "buildings") search.set("tab", params.tab);

  const query = search.toString();
  return query ? `/properties?${query}` : "/properties";
}

/**
 * Counts active filter criteria for compact mobile filter badge indicators.
 */
export function countActiveListingFilters(filters: ListingFilterSnapshot): number {
  let count = 0;
  if (filters.quickMode !== "all") count += 1;
  if (filters.searchInput.trim() !== "") count += 1;
  if (filters.city !== "all") count += 1;
  if (filters.maxRent !== "") count += 1;
  if (filters.capacity !== "") count += 1;
  return count;
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
 * Always hides buildings with 0 vacant rooms so public listings only show rentable inventory.
 */
export function filterPropertiesByQuickMode(
  properties: PublicProperty[],
  mode: ListingQuickMode
): PublicProperty[] {
  const withVacancy = properties.filter((property) => property.available_rooms_count > 0);

  if (mode === "all" || mode === "vacant") {
    return withVacancy;
  }

  if (mode === "solo") {
    return withVacancy.filter((property) =>
      property.rooms.some((room) => room.is_available && room.capacity === 1)
    );
  }

  return withVacancy.filter((property) =>
    property.rooms.some((room) => room.is_available && room.capacity >= 2)
  );
}

/**
 * Flattens available rooms across loaded buildings and ranks them with photos first,
 * then by lowest monthly rent so visitors immediately see actionable vacant units.
 */
export function extractFeaturedVacantRooms(
  properties: PublicProperty[],
  limit?: number
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

  return limit !== undefined ? candidates.slice(0, limit) : candidates;
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
 * Lowest monthly rent among currently available rooms, or null when none are open.
 */
export function computeLowestRent(properties: PublicProperty[]): number | null {
  let lowest: number | null = null;
  for (const property of properties) {
    for (const room of property.rooms) {
      if (!room.is_available || typeof room.rent !== "number") continue;
      if (lowest === null || room.rent < lowest) lowest = room.rent;
    }
  }
  return lowest;
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
