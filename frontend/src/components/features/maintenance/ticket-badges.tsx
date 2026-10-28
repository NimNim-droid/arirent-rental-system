import { Badge } from "@/components/ui/badge";
import type { MaintenanceTicket } from "@/lib/types";

type TicketStatus = MaintenanceTicket["status"];
type TicketPriority = MaintenanceTicket["priority"];

const STATUS_VARIANTS: Record<TicketStatus, "success" | "warning" | "danger" | "info" | "neutral"> = {
  pending: "warning",
  in_progress: "info",
  resolved: "success",
  archived: "neutral",
};

const STATUS_LABELS: Record<TicketStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  resolved: "Resolved",
  archived: "Archived",
};

const PRIORITY_VARIANTS: Record<TicketPriority, "danger" | "neutral"> = {
  urgent: "danger",
  normal: "neutral",
};

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  urgent: "Urgent",
  normal: "Normal",
};

export function TicketStatusBadge({ status, className }: { status: TicketStatus; className?: string }) {
  return (
    <Badge dot variant={STATUS_VARIANTS[status] ?? "neutral"} className={className}>
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

export function TicketPriorityBadge({ priority, className }: { priority: TicketPriority; className?: string }) {
  return (
    <Badge variant={PRIORITY_VARIANTS[priority] ?? "neutral"} className={className}>
      {PRIORITY_LABELS[priority] ?? priority}
    </Badge>
  );
}

export const ticketStatusLabels = STATUS_LABELS;
