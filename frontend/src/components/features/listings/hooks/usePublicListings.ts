import { useCallback, useEffect, useMemo, useState } from "react";
import { listingsService } from "@/lib/services/listings";
import { getErrorMessage } from "@/lib/errors";
import type { PublicProperty } from "@/lib/types";
import {
  computeListingTotals,
  extractFeaturedVacantRooms,
  extractPrimaryLandlordContact,
  filterPropertiesByQuickMode,
  type ListingQuickMode,
} from "../listing-helpers";

export function usePublicListings() {
  const [listings, setListings] = useState<PublicProperty[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [quickMode, setQuickMode] = useState<ListingQuickMode>("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [city, setCity] = useState("all");
  const [maxRent, setMaxRent] = useState("");
  const [capacity, setCapacity] = useState("");

  const [visitProperty, setVisitProperty] = useState<PublicProperty | null>(null);

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

  const featuredRooms = useMemo(
    () => extractFeaturedVacantRooms(visibleListings, 6),
    [visibleListings]
  );

  const totals = useMemo(
    () => computeListingTotals(listings, cities.length),
    [listings, cities.length]
  );

  const primaryContact = useMemo(
    () => extractPrimaryLandlordContact(listings),
    [listings]
  );

  const hasActiveFilters =
    quickMode !== "all" ||
    debouncedQuery.trim() !== "" ||
    city !== "all" ||
    maxRent !== "" ||
    capacity !== "";

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
    hasActiveFilters,
    clearFilters,
    fetchListings,
    totals,
    primaryContact,
    visitProperty,
    setVisitProperty,
  };
}
