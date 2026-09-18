import { useCallback, useEffect, useMemo, useState } from "react";
import { maintenanceService } from "@/lib/services/maintenance";
import { getErrorMessage } from "@/lib/errors";
import type { MaintenanceTicket } from "@/lib/types";

export const MAINTENANCE_FILTERS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
] as const;

export function useAdminMaintenance() {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [filter, setFilter] = useState("all");
  const [showArchived, setShowArchived] = useState(false);
  const [activeTicket, setActiveTicket] = useState<MaintenanceTicket | null>(null);
  const [techName, setTechName] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await maintenanceService.getTickets({ per_page: 200 });
      setTickets(res.data);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load maintenance tickets."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket) return;
    setBusyId(activeTicket.id);
    setError("");
    try {
      await maintenanceService.dispatchTicket(activeTicket.id, {
        technician_name: techName,
        admin_notes: adminNotes || undefined,
      });
      setActiveTicket(null);
      setTechName("");
      setAdminNotes("");
      await loadTickets();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to dispatch a technician."));
    } finally {
      setBusyId(null);
    }
  };

  const handleMarkResolved = async (id: string) => {
    setBusyId(id);
    setError("");
    try {
      await maintenanceService.resolveTicket(id);
      await loadTickets();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to mark the ticket as resolved."));
    } finally {
      setBusyId(null);
    }
  };

  const handleArchive = async (id: string) => {
    setBusyId(`archive-${id}`);
    setError("");
    try {
      await maintenanceService.updateTicket(id, { status: "archived" });
      await loadTickets();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to archive ticket."));
    } finally {
      setBusyId(null);
    }
  };

  const openDispatch = (ticket: MaintenanceTicket) => {
    setActiveTicket(ticket);
    setTechName(ticket.technician_name || "");
    setAdminNotes(ticket.admin_notes || "");
  };

  const nonArchivedTickets = useMemo(
    () => tickets.filter((t) => t.status !== "archived"),
    [tickets]
  );
  const archivedCount = useMemo(
    () => tickets.filter((t) => t.status === "archived").length,
    [tickets]
  );

  const counts = useMemo(() => {
    return MAINTENANCE_FILTERS.reduce<Record<string, number>>((acc, tab) => {
      acc[tab.value] =
        tab.value === "all"
          ? nonArchivedTickets.length
          : nonArchivedTickets.filter((t) => t.status === tab.value).length;
      return acc;
    }, {});
  }, [nonArchivedTickets]);

  const filteredTickets = useMemo(() => {
    if (showArchived) return tickets.filter((t) => t.status === "archived");
    if (filter === "all") return nonArchivedTickets;
    return tickets.filter((t) => t.status === filter);
  }, [tickets, filter, showArchived, nonArchivedTickets]);

  return {
    tickets,
    filteredTickets,
    filter,
    setFilter,
    showArchived,
    setShowArchived,
    activeTicket,
    setActiveTicket,
    techName,
    setTechName,
    adminNotes,
    setAdminNotes,
    loading,
    error,
    busyId,
    archivedCount,
    counts,
    loadTickets,
    handleDispatch,
    handleMarkResolved,
    handleArchive,
    openDispatch,
  };
}
