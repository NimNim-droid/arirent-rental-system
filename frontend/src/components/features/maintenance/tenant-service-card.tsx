import { Clock, User, ChevronRight } from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { formatDate } from "@/lib/formatters";
import type { MaintenanceTicket } from "@/lib/types";

interface TenantServiceCardProps {
  ticket: MaintenanceTicket;
  onSelect: (ticket: MaintenanceTicket) => void;
}

const STATUS_CONFIG: Record<
  MaintenanceTicket["status"],
  { label: string; variant: BadgeProps["variant"] }
> = {
  pending: { label: "Open", variant: "danger" },
  in_progress: { label: "In Progress", variant: "warning" },
  resolved: { label: "Resolved", variant: "success" },
  archived: { label: "Archived", variant: "neutral" },
};

const TYPE_NAMES: Record<MaintenanceTicket["type"], string> = {
  plumbing: "Plumbing Repair",
  electrical: "Electrical Repair",
  appliances: "Appliance Repair",
  general: "Housekeeping / General",
};

/**
 * Mobile-first Service/Maintenance Ticket Card matching the AriRent phone UI.
 */
export function TenantServiceCard({ ticket, onSelect }: TenantServiceCardProps) {
  const statusMeta = STATUS_CONFIG[ticket.status] ?? {
    label: ticket.status,
    variant: "neutral" as const,
  };

  const propertyName = ticket.property_name || "AriRent Residences";
  const roomName = ticket.room ? `Unit ${ticket.room}` : "Unit";

  // Use the first sentence or first 50 chars of description as the headline,
  // or fall back to the formatted type name.
  const headline =
    ticket.description.split("\n")[0].trim() || TYPE_NAMES[ticket.type] || "Service Request";

  return (
    <div
      onClick={() => onSelect(ticket)}
      className="group relative cursor-pointer rounded-2xl border border-edge bg-card p-4 shadow-card transition-all duration-150 hover:border-edge-strong hover:shadow-soft active:scale-[0.99]"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(ticket);
        }
      }}
      aria-label={`View request: ${headline}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <h4 className="font-bold text-sm sm:text-base text-fg tracking-tight truncate group-hover:text-accent transition-colors">
            {headline}
          </h4>
          <p className="text-xs text-muted truncate">
            {propertyName} | <span className="font-semibold text-fg-soft">{roomName}</span>
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Badge
            variant={statusMeta.variant}
            className="rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase"
          >
            {statusMeta.label}
          </Badge>
          <ChevronRight className="h-4 w-4 text-faint group-hover:text-accent transition-colors" />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-edge/60 pt-2.5 text-xs text-muted">
        <span className="flex items-center gap-1.5 text-[11px]">
          <Clock className="h-3.5 w-3.5 text-faint shrink-0" />
          <span>Requested on {formatDate(ticket.date || ticket.created_at)}</span>
        </span>

        {ticket.technician_name && (
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-fg-soft bg-hover px-2 py-0.5 rounded-md">
            <User className="h-3 w-3 text-accent shrink-0" />
            <span>Technician: {ticket.technician_name}</span>
          </span>
        )}
      </div>
    </div>
  );
}
