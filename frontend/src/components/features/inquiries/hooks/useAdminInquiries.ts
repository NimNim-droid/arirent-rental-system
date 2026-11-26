import { useCallback, useEffect, useState, type FormEvent } from "react";
import { inquiriesService } from "@/lib/services/inquiries";
import { propertiesService } from "@/lib/services/properties";
import { getErrorMessage } from "@/lib/errors";
import type {
  Inquiry,
  InquiryStatus,
  InquiryStatusCounts,
  Property,
} from "@/lib/types";

export function useAdminInquiries(statusLabels: Record<InquiryStatus, string>) {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [counts, setCounts] = useState<InquiryStatusCounts>({
    new: 0,
    scheduled: 0,
    visited: 0,
    converted: 0,
    cancelled: 0,
  });
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [statusFilter, setStatusFilter] = useState("open");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [activeInquiry, setActiveInquiry] = useState<Inquiry | null>(null);
  const [editStatus, setEditStatus] = useState<InquiryStatus>("scheduled");
  const [editScheduledAt, setEditScheduledAt] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    propertiesService
      .getProperties()
      .then(setProperties)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 220);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(""), 4000);
    return () => clearTimeout(t);
  }, [successMsg]);

  const loadInquiries = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await inquiriesService.getInquiries({
        status: statusFilter,
        property_id: propertyFilter,
        search: debouncedSearch || undefined,
      });
      setInquiries(res.data);
      if (res.meta.status_counts) {
        setCounts(res.meta.status_counts);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load viewing inquiries."));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, propertyFilter, debouncedSearch]);

  useEffect(() => {
    loadInquiries();
  }, [loadInquiries]);

  const openManageModal = (inquiry: Inquiry, defaultNextStatus?: InquiryStatus) => {
    setActiveInquiry(inquiry);
    setEditStatus(
      defaultNextStatus ?? (inquiry.status === "new" ? "scheduled" : inquiry.status)
    );
    if (inquiry.scheduled_at) {
      setEditScheduledAt(inquiry.scheduled_at.slice(0, 16));
    } else if (inquiry.preferred_date) {
      const defaultHour =
        inquiry.preferred_time === "morning"
          ? "10:00"
          : inquiry.preferred_time === "evening"
          ? "17:30"
          : "14:00";
      setEditScheduledAt(`${inquiry.preferred_date}T${defaultHour}`);
    } else {
      setEditScheduledAt("");
    }
    setEditNotes(inquiry.admin_notes ?? "");
  };

  const handleSaveInquiry = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeInquiry) return;

    setSaving(true);
    setError("");
    try {
      await inquiriesService.updateInquiry(activeInquiry.id, {
        status: editStatus,
        scheduled_at: editScheduledAt ? new Date(editScheduledAt).toISOString() : null,
        admin_notes: editNotes.trim() || null,
      });
      setSuccessMsg(`Updated inquiry for ${activeInquiry.name}.`);
      setActiveInquiry(null);
      await loadInquiries();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to update inquiry."));
    } finally {
      setSaving(false);
    }
  };

  const handleQuickStatus = async (inquiry: Inquiry, status: InquiryStatus) => {
    setError("");
    try {
      await inquiriesService.updateInquiry(inquiry.id, { status });
      setSuccessMsg(`Marked ${inquiry.name} as ${statusLabels[status] || status}.`);
      await loadInquiries();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to update inquiry status."));
    }
  };

  const handleDelete = async (inquiry: Inquiry) => {
    if (!window.confirm(`Remove viewing inquiry from ${inquiry.name}?`)) return;
    try {
      await inquiriesService.deleteInquiry(inquiry.id);
      setSuccessMsg("Inquiry removed.");
      await loadInquiries();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to delete inquiry."));
    }
  };

  return {
    inquiries,
    counts,
    properties,
    loading,
    error,
    successMsg,
    statusFilter,
    setStatusFilter,
    propertyFilter,
    setPropertyFilter,
    searchInput,
    setSearchInput,
    activeInquiry,
    setActiveInquiry,
    editStatus,
    setEditStatus,
    editScheduledAt,
    setEditScheduledAt,
    editNotes,
    setEditNotes,
    saving,
    loadInquiries,
    openManageModal,
    handleSaveInquiry,
    handleQuickStatus,
    handleDelete,
  };
}
