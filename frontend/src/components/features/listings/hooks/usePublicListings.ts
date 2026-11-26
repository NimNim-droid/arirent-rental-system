import { useCallback, useEffect, useMemo, useState } from "react";
import { listingsService } from "@/lib/services/listings";
import { getErrorMessage } from "@/lib/errors";
import type { PublicProperty } from "@/lib/types";

export function usePublicListings() {
  const [listings, setListings] = useState<PublicProperty[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const hasActiveFilters =
    debouncedQuery.trim() !== "" || city !== "all" || maxRent !== "" || capacity !== "";

  const clearFilters = () => {
    setSearchInput("");
    setDebouncedQuery("");
    setCity("all");
    setMaxRent("");
    setCapacity("");
  };

  const totals = useMemo(() => {
    const totalBuildings = listings.length;
    const totalVacant = listings.reduce((sum, p) => sum + (p.available_rooms_count || 0), 0);
    return { totalBuildings, totalVacant };
  }, [listings]);

  return {
    listings,
    cities,
    loading,
    error,
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
    visitProperty,
    setVisitProperty,
  };
}
