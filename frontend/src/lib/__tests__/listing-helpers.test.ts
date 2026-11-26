import { describe, expect, it } from "vitest";
import {
  buildPropertiesCatalogUrl,
  computeListingTotals,
  countActiveListingFilters,
  extractFeaturedVacantRooms,
  extractPrimaryLandlordContact,
  filterPropertiesByQuickMode,
  normalizeExternalUrl,
  parseCatalogTabParam,
  parseQuickModeParam,
  sanitizePhoneHref,
} from "@/components/features/listings/listing-helpers";
import type { PublicProperty, PublicRoom } from "@/lib/types";

function makeRoom(overrides: Partial<PublicRoom> = {}): PublicRoom {
  return {
    id: "room-1",
    property_id: "prop-1",
    room_number: "101",
    rent: 7500,
    status: "vacant",
    is_available: true,
    capacity: 1,
    floor_area: 18,
    amenities: [],
    advance_months: 1,
    deposit_months: 1,
    move_in_total: 15000,
    cover_photo_url: null,
    photos: [],
    ...overrides,
  };
}

function makeProperty(overrides: Partial<PublicProperty> = {}): PublicProperty {
  return {
    id: "prop-1",
    name: "AriRent Maple Suites",
    city: "Makati",
    address: "120 Chino Roces Ave",
    amenities: [],
    listed_rooms_count: 2,
    available_rooms_count: 1,
    starting_rent: 7500,
    cover_photo_url: null,
    photos: [],
    rooms: [makeRoom()],
    ...overrides,
  };
}

describe("listing-helpers", () => {
  it("normalizes external URLs and strips empty values", () => {
    expect(normalizeExternalUrl("m.me/arirent")).toBe("https://m.me/arirent");
    expect(normalizeExternalUrl("https://m.me/arirent")).toBe("https://m.me/arirent");
    expect(normalizeExternalUrl("   ")).toBeNull();
    expect(normalizeExternalUrl(null)).toBeNull();
  });

  it("sanitizes phone numbers for tel/sms links", () => {
    expect(sanitizePhoneHref("+63 (917) 222-3333")).toBe("+639172223333");
    expect(sanitizePhoneHref("no digits")).toBeNull();
  });

  it("filters properties accurately by quick discovery mode", () => {
    const soloBuilding = makeProperty({
      id: "p1",
      available_rooms_count: 1,
      rooms: [makeRoom({ id: "r1", capacity: 1, is_available: true })],
    });
    const sharedBuilding = makeProperty({
      id: "p2",
      available_rooms_count: 1,
      rooms: [makeRoom({ id: "r2", capacity: 3, is_available: true })],
    });
    const fullBuilding = makeProperty({
      id: "p3",
      available_rooms_count: 0,
      rooms: [makeRoom({ id: "r3", capacity: 1, is_available: false, status: "occupied" })],
    });

    const all = [soloBuilding, sharedBuilding, fullBuilding];

    // Full buildings (0 vacant rooms) are excluded across all public discovery modes
    expect(filterPropertiesByQuickMode(all, "all").map((p) => p.id)).toEqual(["p1", "p2"]);
    expect(filterPropertiesByQuickMode(all, "vacant").map((p) => p.id)).toEqual(["p1", "p2"]);
    expect(filterPropertiesByQuickMode(all, "solo").map((p) => p.id)).toEqual(["p1"]);
    expect(filterPropertiesByQuickMode(all, "shared").map((p) => p.id)).toEqual(["p2"]);
  });

  it("extracts vacant featured rooms with photos ranked first, then lowest rent", () => {
    const properties = [
      makeProperty({
        id: "p1",
        cover_photo_url: null,
        rooms: [
          makeRoom({ id: "r-cheap-no-photo", rent: 5000, is_available: true }),
          makeRoom({ id: "r-occupied", rent: 4000, is_available: false, status: "occupied" }),
        ],
      }),
      makeProperty({
        id: "p2",
        cover_photo_url: "https://example.com/building.jpg",
        rooms: [
          makeRoom({ id: "r-photo-higher", rent: 9000, is_available: true }),
          makeRoom({
            id: "r-photo-lower",
            rent: 6800,
            cover_photo_url: "https://example.com/room.jpg",
            is_available: true,
          }),
        ],
      }),
    ];

    const featured = extractFeaturedVacantRooms(properties, 6);
    expect(featured.map((f) => f.room.id)).toEqual([
      "r-photo-lower",
      "r-photo-higher",
      "r-cheap-no-photo",
    ]);
    expect(featured[1].previewPhotoUrl).toBe("https://example.com/building.jpg");
  });

  it("computes real portfolio totals and picks primary configured landlord contact", () => {
    const properties = [
      makeProperty({ id: "p1", listed_rooms_count: 5, available_rooms_count: 2 }),
      makeProperty({
        id: "p2",
        name: "AriRent Cedar",
        listed_rooms_count: 8,
        available_rooms_count: 3,
        contact_name: "Ana Reyes",
        contact_phone: "0917-555-0199",
        messenger_url: "m.me/arirentcedar",
      }),
    ];

    expect(computeListingTotals(properties, 2)).toEqual({
      totalBuildings: 2,
      totalVacant: 5,
      totalListedRooms: 13,
      citiesCount: 2,
    });

    const contact = extractPrimaryLandlordContact(properties);
    expect(contact?.propertyId).toBe("p2");
    expect(contact?.contactName).toBe("Ana Reyes");
    expect(contact?.messengerUrl).toBe("https://m.me/arirentcedar");
  });

  it("parses URL params, builds catalog URLs, and counts active filters accurately", () => {
    expect(parseQuickModeParam("vacant")).toBe("vacant");
    expect(parseQuickModeParam("invalid")).toBe("all");
    expect(parseCatalogTabParam("rooms")).toBe("rooms");
    expect(parseCatalogTabParam(null)).toBe("buildings");

    expect(
      buildPropertiesCatalogUrl({
        q: "Makati",
        mode: "vacant",
        city: "all",
        maxRent: "12000",
        tab: "rooms",
      })
    ).toBe("/properties?q=Makati&mode=vacant&max_rent=12000&tab=rooms");

    expect(buildPropertiesCatalogUrl({ mode: "all", city: "all", tab: "buildings" })).toBe(
      "/properties"
    );

    expect(
      countActiveListingFilters({
        quickMode: "solo",
        searchInput: "Maple",
        city: "Makati",
        maxRent: "",
        capacity: "1",
      })
    ).toBe(4);
  });
});
