import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { listingsService } from "@/lib/services/listings";
import { getErrorMessage } from "@/lib/errors";
import type { PublicProperty } from "@/lib/types";
import {
  computeListingTotals,
  countActiveListingFilters,
  extractFeaturedVacantRooms,
  extractPrimaryLandlordContact,
  filterPropertiesByQuickMode,
  parseQuickModeParam,
  type ListingQuickMode,
} from "../listing-helpers";

interface UsePublicListingsOptions {
  /** Hydrate initial filters from URL query parameters (used on /properties catalog). */
  syncFromUrl?: boolean;
}

export function usePublicListings(options: UsePublicListingsOptions = {}) {
  const { syncFromUrl = false } = options;
  const [searchParams] = useSearchParams();

  const [listings, setListings] = useState<PublicProperty[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [quickMode, setQuickMode] = useState<ListingQuickMode>(() =>
    syncFromUrl ? parseQuickModeParam(searchParams.get("mode")) : "all"
  );
  const [searchInput, setSearchInput] = useState(() =>
    syncFromUrl ? searchParams.get("q") ?? "" : ""
  );
  const [debouncedQuery, setDebouncedQuery] = useState(() =>
    syncFromUrl ? searchParams.get("q") ?? "" : ""
  );
  const [city, setCity] = useState(() =>
    syncFromUrl ? searchParams.get("city") ?? "all" : "all"
  );
  const [maxRent, setMaxRent] = useState(() =>
    syncFromUrl ? searchParams.get("max_rent") ?? "" : ""
  );
  const [capacity, setCapacity] = useState(() =>
    syncFromUrl ? searchParams.get("capacity") ?? "" : ""
  );

  const [visitProperty, setVisitProperty] = useState<PublicProperty | null>(null);

  // Sync URL updates when navigating between shortcuts into /properties
  useEffect(() => {
    if (!syncFromUrl) return;
    const nextMode = parseQuickModeParam(searchParams.get("mode"));
    const nextQ = searchParams.get("q") ?? "";
    const nextCity = searchParams.get("city") ?? "all";
    const nextMaxRent = searchParams.get("max_rent") ?? "";
    const nextCapacity = searchParams.get("capacity") ?? "";

    setQuickMode(nextMode);
    setSearchInput(nextQ);
    setDebouncedQuery(nextQ);
    setCity(nextCity);
    setMaxRent(nextMaxRent);
    setCapacity(nextCapacity);
  }, [syncFromUrl, searchParams]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchInput), 220);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listingsService.getPublicListings({
        q: debouncedQuery || undefined,
        city: city !== "all" ? city : undefined,
        max_rent: maxRent ? Number(maxRent) : undefined,
        capacity: capacity ? Number(capacity) : undefined,
      });
      setListings(res.data);
      setCities(res.meta.cities);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load property listings."));
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, city, maxRent, capacity]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const visibleListings = useMemo(
    () => filterPropertiesByQuickMode(listings, quickMode),
    [listings, quickMode]
  );

  const allVacantRooms = useMemo(() => {
    const rooms = extractFeaturedVacantRooms(visibleListings);
    if (quickMode === "solo") {
      return rooms.filter((item) => item.room.capacity === 1);
    }
    if (quickMode === "shared") {
      return rooms.filter((item) => item.room.capacity >= 2);
    }
    return rooms;
  }, [visibleListings, quickMode]);

  const featuredRooms = useMemo(() => allVacantRooms.slice(0, 6), [allVacantRooms]);

  const totals = useMemo(
    () => computeListingTotals(listings, cities.length),
    [listings, cities.length]
  );

  const primaryContact = useMemo(
    () => extractPrimaryLandlordContact(listings),
    [listings]
  );

  const activeFilterCount = useMemo(
    () =>
      countActiveListingFilters({
        quickMode,
        searchInput: debouncedQuery,
        city,
        maxRent,
        capacity,
      }),
    [quickMode, debouncedQuery, city, maxRent, capacity]
  );

  const hasActiveFilters = activeFilterCount > 0;

  const clearFilters = useCallback(() => {
    setQuickMode("all");
    setSearchInput("");
    setDebouncedQuery("");
    setCity("all");
    setMaxRent("");
    setCapacity("");
  }, []);

  return {
    listings,
    visibleListings,
    featuredRooms,
    allVacantRooms,
    cities,
    loading,
    error,
    quickMode,
    setQuickMode,
    searchInput,
    setSearchInput,
    city,
    setCity,
    maxRent,
    setMaxRent,
    capacity,
    setCapacity,
    activeFilterCount,
    hasActiveFilters,
    clearFilters,
    fetchListings,
    totals,
    primaryContact,
    visitProperty,
    setVisitProperty,
  };
}
