import { Link } from "react-router";
import {
  Calendar,
  CalendarClock,
  CheckCircle2,
  DoorOpen,
  Mail,
  Phone,
  RefreshCw,
  Search,
  Smartphone,
  Trash2,
  UserCheck,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card } from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonRows } from "@/components/ui/skeleton";
import { useAdminInquiries } from "@/components/features/inquiries";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { InquiryStatus } from "@/lib/types";

const STATUS_META: Record<
  InquiryStatus,
  { label: string; variant: BadgeProps["variant"] }
> = {
  new: { label: "New Request", variant: "warning" },
  scheduled: { label: "Visit Scheduled", variant: "info" },
  visited: { label: "Visited Property", variant: "success" },
  converted: { label: "Applied as Tenant", variant: "success" },
  cancelled: { label: "Closed / Cancelled", variant: "neutral" },
};

const STATUS_LABELS: Record<InquiryStatus, string> = {
  new: STATUS_META.new.label,
  scheduled: STATUS_META.scheduled.label,
  visited: STATUS_META.visited.label,
  converted: STATUS_META.converted.label,
  cancelled: STATUS_META.cancelled.label,
};

const TABS: Array<{ key: string; label: string }> = [
  { key: "open", label: "Open Follow-ups" },
  { key: "new", label: "New" },
  { key: "scheduled", label: "Scheduled" },
  { key: "visited", label: "Visited" },
  { key: "converted", label: "Converted" },
  { key: "cancelled", label: "Cancelled" },
  { key: "all", label: "All" },
];

export default function AdminInquiriesPage() {
  const {
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
  } = useAdminInquiries(STATUS_LABELS);

  const openTotal = counts.new + counts.scheduled + counts.visited;
  const getTabCount = (key: string): number | null => {
    if (key === "open") return openTotal;
    if (key === "all") {
      return (
        counts.new +
        counts.scheduled +
        counts.visited +
        counts.converted +
        counts.cancelled
      );
    }
    return counts[key as InquiryStatus] ?? null;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visit Inquiries"
        subtitle="Track prospective tenants who want to inspect a property before submitting an application"
        action={
          <Button variant="secondary" size="sm" onClick={loadInquiries}>
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        }
      />

      {successMsg && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-md border border-success-border bg-success-bg px-3.5 py-2.5 text-xs font-medium text-success-fg"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-danger-border bg-danger-bg px-3.5 py-2.5 text-xs font-medium text-danger-fg">
          {error}
        </div>
      )}

      {/* Status Tabs & Filters */}
      <Card className="p-4 space-y-3.5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {TABS.map((tab) => {
            const count = getTabCount(tab.key);
            const active = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  active
                    ? "bg-accent text-white"
                    : "bg-inset text-fg-soft hover:bg-hover hover:text-fg border border-edge"
                }`}
              >
                <span>{tab.label}</span>
                {count !== null && (
                  <span
                    className={`rounded px-1.5 py-0.2 text-[11px] tabular-nums ${
                      active ? "bg-white/20 text-white" : "bg-card text-muted"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-7">
            <Input
              id="inquirySearch"
              placeholder="Search visitor name, mobile number, email, or note..."
              icon={<Search className="h-3.5 w-3.5" />}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <div className="sm:col-span-5">
            <Select
              id="inquiryPropertyFilter"
              value={propertyFilter}
              onChange={(e) => setPropertyFilter(e.target.value)}
            >
              <option value="all">All Buildings</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {/* Inquiries List */}
      {loading ? (
        <Card className="p-6">
          <SkeletonRows rows={5} />
        </Card>
      ) : inquiries.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CalendarClock className="h-4 w-4" />}
            title="No viewing inquiries in this view"
            description="When prospective tenants request an in-person room viewing on your public listing page, their contact details and preferred dates appear here."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {inquiries.map((inq) => {
            const meta = STATUS_META[inq.status] || STATUS_META.new;
            const dialPhone = inq.phone.replace(/[^0-9+]/g, "");

            return (
              <Card key={inq.id} className="p-4 sm:p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-fg">{inq.name}</h3>
                      <Badge variant={meta.variant} dot={inq.status === "new"}>
                        {meta.label}
                      </Badge>
                      {inq.created_at && (
                        <span className="text-xs text-muted">
                          Requested {formatDate(inq.created_at)}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-fg-soft">
                      <span className="font-medium text-fg">
                        {inq.property?.name ?? `Property #${inq.property_id}`}
                      </span>
                      {inq.room ? (
                        <span className="inline-flex items-center gap-1 rounded border border-edge bg-inset px-2 py-0.5 tabular-nums">
                          <DoorOpen className="h-3 w-3 text-muted" />
                          Room {inq.room.room_number} ({formatCurrency(inq.room.rent)}/mo &middot;{" "}
                          {inq.room.status})
                        </span>
                      ) : (
                        <span className="text-muted">Any available unit</span>
                      )}
                    </div>
                  </div>

                  {/* Direct Visitor Contact Links */}
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    {dialPhone && (
                      <>
                        <a
                          href={`tel:${dialPhone}`}
                          className="inline-flex h-7 items-center gap-1 rounded-md border border-edge bg-inset px-2.5 text-xs font-medium text-fg hover:border-edge-strong hover:bg-hover transition-colors"
                        >
                          <Phone className="h-3 w-3 text-accent" />
                          <span className="tabular-nums">{inq.phone}</span>
                        </a>
                        <a
                          href={`sms:${dialPhone}`}
                          className="inline-flex h-7 items-center gap-1 rounded-md border border-edge bg-inset px-2 text-xs font-medium text-fg-soft hover:bg-hover transition-colors"
                        >
                          <Smartphone className="h-3 w-3" />
                          SMS
                        </a>
                      </>
                    )}
                    {inq.email && (
                      <a
                        href={`mailto:${inq.email}`}
                        className="inline-flex h-7 items-center gap-1 rounded-md border border-edge bg-inset px-2 text-xs text-fg-soft hover:bg-hover transition-colors"
                        title={inq.email}
                      >
                        <Mail className="h-3 w-3" />
                        Email
                      </a>
                    )}
                  </div>
                </div>

                {/* Preferred / Confirmed Schedule + Message */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg border border-edge bg-inset p-3 text-xs">
                  <div className="space-y-1">
                    <p className="text-[11px] font-medium text-muted">Viewing Schedule</p>
                    {inq.scheduled_at ? (
                      <p className="font-semibold text-fg flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-accent" />
                        Confirmed: {new Date(inq.scheduled_at).toLocaleString("en-PH", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    ) : inq.preferred_date ? (
                      <p className="text-fg">
                        Preferred: <strong>{formatDate(inq.preferred_date)}</strong>
                        {inq.preferred_time ? ` (${inq.preferred_time})` : ""}
                      </p>
                    ) : (
                      <p className="text-muted">No specific date selected</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-[11px] font-medium text-muted">Visitor Message / Notes</p>
                    <p className="text-fg-soft leading-relaxed">
                      {inq.message || "No additional message."}
                    </p>
                  </div>
                </div>

                {inq.admin_notes && (
                  <p className="text-xs text-muted">
                    <strong className="text-fg-soft">Manager note:</strong> {inq.admin_notes}
                  </p>
                )}

                {inq.tenant && (
                  <div className="flex items-center justify-between rounded-md border border-success-border bg-success-bg/60 px-3 py-2 text-xs">
                    <span className="inline-flex items-center gap-1.5 font-medium text-success-fg">
                      <UserCheck className="h-3.5 w-3.5" />
                      Submitted tenant application for Room {inq.tenant.room} ({inq.tenant.status})
                    </span>
                    <Link
                      to="/admin/tenants"
                      className="font-semibold text-success-fg hover:underline"
                    >
                      Review in Tenants &rarr;
                    </Link>
                  </div>
                )}

                {/* Workflow Action Footer */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-edge pt-2.5">
                  <span className="text-[11px] text-muted">
                    {inq.status === "visited"
                      ? "Visitor inspected the property — when they apply online, this automatically converts."
                      : inq.status === "new"
                      ? "Call or text the visitor to confirm their inspection time."
                      : ""}
                  </span>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {inq.status === "new" && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => openManageModal(inq, "scheduled")}
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        Confirm Schedule
                      </Button>
                    )}

                    {(inq.status === "new" || inq.status === "scheduled") && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleQuickStatus(inq, "visited")}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Mark Visited
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openManageModal(inq)}
                    >
                      Edit / Notes
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted hover:text-danger-fg"
                      onClick={() => handleDelete(inq)}
                      title="Delete inquiry"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirm Schedule / Notes Modal */}
      {activeInquiry && (
        <Modal
          open={Boolean(activeInquiry)}
          onClose={() => setActiveInquiry(null)}
          title={`Update Inquiry — ${activeInquiry.name}`}
          footer={
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setActiveInquiry(null)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" form="manage-inquiry-form" loading={saving}>
                Save Update
              </Button>
            </>
          }
        >
          <form id="manage-inquiry-form" onSubmit={handleSaveInquiry} className="space-y-4">
            <Select
              id="inqStatus"
              label="Inquiry Status"
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as InquiryStatus)}
            >
              <option value="new">New Request</option>
              <option value="scheduled">Visit Scheduled</option>
              <option value="visited">Visited Property</option>
              <option value="converted">Applied as Tenant</option>
              <option value="cancelled">Cancelled / Not Proceeding</option>
            </Select>

            <Input
              id="inqScheduledAt"
              label="Confirmed Visit Date & Time"
              type="datetime-local"
              value={editScheduledAt}
              onChange={(e) => setEditScheduledAt(e.target.value)}
            />

            <Textarea
              id="inqAdminNotes"
              label="Private Landlord Notes"
              rows={3}
              placeholder="e.g. Confirmed Saturday 2PM via SMS, bringing 1 roommate..."
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
            />
          </form>
        </Modal>
      )}
    </div>
  );
}
