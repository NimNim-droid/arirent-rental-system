import { useState } from "react";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  ClipboardList,
  Paperclip,
  Tag,
  User,
  ZoomIn,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { TicketPriorityBadge, TicketStatusBadge, ticketStatusLabels } from "./ticket-badges";
import { formatDateTime } from "@/lib/formatters";
import type { MaintenanceTicket } from "@/lib/types";

interface TicketDetailPanelProps {
  ticket: MaintenanceTicket;
  busy: boolean;
  onBack: () => void;
  onSave: (payload: {
    status: MaintenanceTicket["status"];
    technician_name: string;
    admin_notes: string;
  }) => void;
}

function initials(name?: string): string {
  if (!name) return "T";
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function TicketDetailPanel({ ticket, busy, onBack, onSave }: TicketDetailPanelProps) {
  const [status, setStatus] = useState<MaintenanceTicket["status"]>(ticket.status);
  const [technicianName, setTechnicianName] = useState(ticket.technician_name ?? "");
  const [adminNotes, setAdminNotes] = useState("");
  const [photoZoomed, setPhotoZoomed] = useState(false);

  const title = ticket.description.length > 44
    ? `${ticket.description.slice(0, 44).trimEnd()}...`
    : ticket.description;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ status, technician_name: technicianName, admin_notes: adminNotes });
  };

  return (
    <Card className="p-5 lg:sticky lg:top-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="-ml-2 lg:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to list
        </Button>
        <h2 className="hidden lg:block text-sm font-bold text-fg">Ticket Details</h2>
        <TicketStatusBadge status={ticket.status} />
      </div>

      {/* Title + submitted date */}
      <div className="mt-3 space-y-1.5 lg:mt-4">
        <h3 className="text-base font-bold text-fg">
          #{ticket.id} – {title}
        </h3>
        {ticket.created_at && (
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <Calendar className="h-3.5 w-3.5" />
            {formatDateTime(ticket.created_at)}
          </p>
        )}
      </div>

      {/* Tenant mini card */}
      <div className="mt-4 flex items-center gap-3 rounded-xl border border-edge bg-inset p-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent">
          {initials(ticket.tenant_name)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-fg">{ticket.tenant_name ?? "—"}</p>
          <p className="truncate text-xs text-muted">
            Room {ticket.room} • {ticket.property_name ?? "—"}
          </p>
        </div>
      </div>

      {/* Details */}
      <dl className="mt-4 space-y-2.5 text-xs">
        <div className="flex items-center justify-between gap-3">
          <dt className="flex items-center gap-1.5 font-semibold text-muted">
            <Tag className="h-3.5 w-3.5" />
            Priority
          </dt>
          <dd>
            <TicketPriorityBadge priority={ticket.priority} />
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="flex items-center gap-1.5 font-semibold text-muted">
            <ClipboardList className="h-3.5 w-3.5" />
            Status
          </dt>
          <dd>
            <TicketStatusBadge status={ticket.status} />
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="flex items-center gap-1.5 font-semibold text-muted">
            <User className="h-3.5 w-3.5" />
            Assigned To
          </dt>
          <dd className="font-semibold text-fg">{ticket.technician_name || "Unassigned"}</dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="flex shrink-0 items-center gap-1.5 font-semibold text-muted">
            <Paperclip className="h-3.5 w-3.5" />
            Description
          </dt>
          <dd className="text-right leading-relaxed text-fg-soft">{ticket.description}</dd>
        </div>
      </dl>

      {/* Attached picture */}
      <h4 className="mt-5 text-xs font-bold text-accent">Attached Pictures</h4>
      <div className="mt-2">
        {ticket.photo_url ? (
          <button
            type="button"
            onClick={() => setPhotoZoomed(true)}
            className="group relative block w-full overflow-hidden rounded-xl border border-edge cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label={`Zoom photo for ticket #${ticket.id}`}
          >
            <img
              src={ticket.photo_url}
              alt={`Ticket #${ticket.id} attached photo`}
              loading="lazy"
              className="h-40 w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
            />
            <span className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-lg bg-app/80 text-fg opacity-80 transition-opacity group-hover:opacity-100">
              <ZoomIn className="h-4 w-4" />
            </span>
          </button>
        ) : (
          <div className="grid h-24 w-full place-items-center rounded-xl border border-dashed border-edge text-xs text-muted">
            No photo attached
          </div>
        )}
      </div>

      {/* Admin response / notes */}
      <h4 className="mt-5 text-xs font-bold text-accent">Admin Response / Notes</h4>
      <div className="mt-2">
        {ticket.admin_notes ? (
          <div className="rounded-xl border border-accent-border/50 bg-info-bg/60 p-3">
            <p className="text-[11px] text-muted">{formatDateTime(ticket.updated_at)}</p>
            <p className="mt-1 text-xs leading-relaxed text-fg-soft whitespace-pre-line">
              {ticket.admin_notes}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-white">
                A
              </div>
              <span className="text-[11px] font-semibold text-fg-soft">Admin</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted">No notes yet.</p>
        )}
      </div>

      {/* Update status form */}
      <form className="mt-5 space-y-3 border-t border-edge pt-4" onSubmit={handleSave}>
        <h4 className="text-xs font-bold text-accent">Update Status</h4>
        <Select
          aria-label="Update ticket status"
          value={status}
          onChange={(e) => setStatus(e.target.value as MaintenanceTicket["status"])}
        >
          {(Object.keys(ticketStatusLabels) as Array<keyof typeof ticketStatusLabels>).map((value) => (
            <option key={value} value={value}>
              {ticketStatusLabels[value]}
            </option>
          ))}
        </Select>

        {status === "in_progress" && (
          <Input
            required
            id="technician-name"
            placeholder="Technician name"
            aria-label="Technician name"
            value={technicianName}
            onChange={(e) => setTechnicianName(e.target.value)}
          />
        )}

        <Textarea
          id="admin-note"
          rows={3}
          placeholder="Add a note (optional)..."
          aria-label="Admin note"
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
        />

        <Button type="submit" className="w-full" loading={busy} disabled={busy}>
          <CheckCircle className="h-4 w-4" />
          Save Update
        </Button>
      </form>

      {/* Photo zoom overlay */}
      {photoZoomed && ticket.photo_url && (
        <Modal
          open
          onClose={() => setPhotoZoomed(false)}
          title={`Ticket #${ticket.id} — Attached Photo`}
          maxWidth="xl"
          footer={
            <Button variant="outline" onClick={() => setPhotoZoomed(false)}>
              Close
            </Button>
          }
        >
          <div className="rounded-xl overflow-hidden border border-edge bg-inset/40">
            <img
              src={ticket.photo_url}
              alt={`Ticket #${ticket.id} attached photo`}
              className="w-full max-h-[70vh] object-contain"
            />
          </div>
        </Modal>
      )}
    </Card>
  );
}
