import { useCallback, useEffect, useState } from "react";
import { maintenanceService } from "@/lib/services/maintenance";
import { getErrorMessage } from "@/lib/errors";
import type { MaintenanceTicket } from "@/lib/types";

export const ISSUE_TYPES: { value: MaintenanceTicket["type"]; label: string }[] = [
  { value: "plumbing", label: "Plumbing (sink, toilet, pipe)" },
  { value: "electrical", label: "Electrical (lights, outlets, switch)" },
  { value: "appliances", label: "Appliances (AC, fridge, water heater)" },
  { value: "general", label: "Other / General" },
];

export function useTenantMaintenance() {
  const [description, setDescription] = useState("");
  const [issueType, setIssueType] = useState<MaintenanceTicket["type"]>("plumbing");
  const [priority, setPriority] = useState<MaintenanceTicket["priority"]>("normal");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicket | null>(null);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await maintenanceService.getTickets({ per_page: 100 });
      setTickets(res.data);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load your requests."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      await maintenanceService.createTicket({
        type: issueType,
        description,
        priority,
      });
      setDescription("");
      setPriority("normal");
      setNotice(
        "Request submitted! Our maintenance team will respond within 24 hours."
      );
      await loadTickets();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to submit your request."));
    } finally {
      setSubmitting(false);
    }
  };

  return {
    tickets,
    loading,
    error,
    notice,
    submitting,
    selectedTicket,
    setSelectedTicket,
    description,
    setDescription,
    issueType,
    setIssueType,
    priority,
    setPriority,
    loadTickets,
    handleSubmit,
  };
}
