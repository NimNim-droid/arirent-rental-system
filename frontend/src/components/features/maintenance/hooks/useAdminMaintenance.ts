import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { maintenanceService, type TicketQuery } from "@/lib/services/maintenance";
import { propertiesService } from "@/lib/services/properties";
import { getErrorMessage } from "@/lib/errors";
import type {
  MaintenanceTicket,
  PaginatedResponse,
  Property,
  TicketStatusCounts,
} from "@/lib/types";

/** Rows per page, matching the maintenance report table design. */
const PAGE_SIZE = 10;
/** Milliseconds to wait after typing before a search request is sent. */
const SEARCH_DEBOUNCE_MS = 350;

const EMPTY_COUNTS: TicketStatusCounts = {
  pending: 0,
  in_progress: 0,
  resolved: 0,
  archived: 0,
};

export interface TicketUpdateInput {
  status: MaintenanceTicket["status"];
  technician_name?: string;
  admin_notes?: string;
}

export function useAdminMaintenance() {
  // ---- Data ----
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<MaintenanceTicket>["meta"] | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);

  // ---- Filters ----
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  // ---- Selection ----
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // ---- Status ----
  const [loading, setLoading] = useState(true);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const searchTimer = useRef<number | null>(null);

  const buildQuery = useCallback(
    (): TicketQuery => ({
      page,
      per_page: PAGE_SIZE,
      // "All Statuses" hides archived unless explicitly selected (API 'active' = non-archived).
      status: statusFilter === "all" ? "active" : statusFilter,
      property_id: propertyFilter !== "all" ? propertyFilter : undefined,
      search: search.trim() !== "" ? search.trim() : undefined,
      date_from: dateFrom !== "" ? dateFrom : undefined,
      date_to: dateTo !== "" ? dateTo : undefined,
    }),
    [page, statusFilter, propertyFilter, search, dateFrom, dateTo]
  );

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await maintenanceService.getTickets(buildQuery());
        if (cancelled) return;

        setTickets(res.data);
        setMeta(res.meta);

        // Keep the current selection when it is still visible; otherwise
        // fall back to the first ticket so the detail panel stays populated.
        setSelectedId((prev) => {
          if (prev && res.data.some((t) => t.id === prev)) return prev;
          return res.data[0]?.id ?? null;
        });
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, "Unable to load maintenance tickets."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [buildQuery, refreshKey]);

  // Load the property list once for the property dropdown.
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setPropertiesLoading(true);
      try {
        const list = await propertiesService.getProperties();
        if (!cancelled) setProperties(list);
      } catch {
        // Non-critical: the dropdown simply stays empty.
      } finally {
        if (!cancelled) setPropertiesLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimer.current) window.clearTimeout(searchTimer.current);
    };
  }, []);

  // ---- Filter handlers (each resets to page 1) ----

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    // Commit the search term (and restart the query) after a short debounce
    searchTimer.current = window.setTimeout(() => {
      setPage(1);
      setSearch(value.trim());
    }, SEARCH_DEBOUNCE_MS);
  }, []);

  const handleStatusChange = useCallback((value: string) => {
    setStatusFilter(value);
    setPage(1);
  }, []);

  const handlePropertyChange = useCallback((value: string) => {
    setPropertyFilter(value);
    setPage(1);
  }, []);

  const handleDateFromChange = useCallback((value: string) => {
    setDateFrom(value);
    setPage(1);
  }, []);

  const handleDateToChange = useCallback((value: string) => {
    setDateTo(value);
    setPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setSearchInput("");
    setSearch("");
    setStatusFilter("all");
    setPropertyFilter("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
    setRefreshKey((k) => k + 1);
  }, []);

  // ---- Actions ----

  const handleUpdateTicket = useCallback(
    async (ticketId: string, payload: TicketUpdateInput) => {
      setBusyId(ticketId);
      setError("");
      try {
        await maintenanceService.updateTicket(ticketId, payload);
        setRefreshKey((k) => k + 1);
      } catch (err) {
        setError(getErrorMessage(err, "Unable to update the ticket."));
      } finally {
        setBusyId(null);
      }
    },
    []
  );

  // ---- Derived state ----

  const counts: TicketStatusCounts = useMemo(
    () => meta?.status_counts ?? EMPTY_COUNTS,
    [meta]
  );

  const totalTickets = useMemo(
    () => counts.pending + counts.in_progress + counts.resolved,
    [counts]
  );

  const selectedTicket = useMemo(
    () => tickets.find((t) => t.id === selectedId) ?? null,
    [tickets, selectedId]
  );

  return {
    // data
    tickets,
    meta,
    properties,
    // filters
    search: searchInput,
    searchCommitted: search,
    statusFilter,
    propertyFilter,
    dateFrom,
    dateTo,
    page,
    pageSize: PAGE_SIZE,
    // selection
    selectedId,
    selectedTicket,
    setSelectedId,
    // status
    loading,
    propertiesLoading,
    error,
    busyId,
    counts,
    totalTickets,
    // actions
    handleSearchChange,
    handleStatusChange,
    handlePropertyChange,
    handleDateFromChange,
    handleDateToChange,
    handlePageChange: setPage,
    resetFilters,
    handleUpdateTicket,
    refresh: () => setRefreshKey((k) => k + 1),
  };
}
