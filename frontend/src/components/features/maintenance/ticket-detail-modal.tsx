import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { MaintenanceTicket } from "@/lib/types";

interface TicketDetailModalProps {
  ticket: MaintenanceTicket | null;
  onClose: () => void;
}

export function TicketDetailModal({ ticket, onClose }: TicketDetailModalProps) {
  if (!ticket) return null;

  const formatId = (t: MaintenanceTicket) =>
    /^\d+$/.test(t.id) ? `#${t.id}` : t.id;

  return (
    <Modal
      open={!!ticket}
      onClose={onClose}
      title={`Request ${formatId(ticket)}`}
      footer={
        <Button type="button" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted">
            {ticket.type}
          </span>
          <Badge
            dot
            variant={
              ticket.priority === "urgent"
                ? "danger"
                : ticket.status === "resolved"
                ? "success"
                : "warning"
            }
          >
            {ticket.status === "pending"
              ? "Pending"
              : ticket.status.replace("_", " ")}
          </Badge>
        </div>

        <div className="space-y-1.5 rounded-xl border border-edge bg-inset p-4 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted">Priority</span>
            <span className="font-bold capitalize text-fg">{ticket.priority}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">Date Submitted</span>
            <span className="font-bold capitalize text-fg">{ticket.date}</span>
          </div>
          {ticket.technician_name && (
            <div className="flex items-center justify-between">
              <span className="text-muted">Technician</span>
              <span className="font-bold capitalize text-fg">
                {ticket.technician_name}
              </span>
            </div>
          )}
          {ticket.admin_notes && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted">Admin Notes</span>
              <span className="font-bold text-right text-fg">
                {ticket.admin_notes}
              </span>
            </div>
          )}
        </div>

        <p className="text-sm leading-relaxed text-fg-soft">{ticket.description}</p>
        <p className="text-[11px] text-muted">
          {ticket.status === "resolved"
            ? "This request has been completed. If the issue persists, please submit a new request."
            : "Our maintenance team will respond within 24 hours. Keep your phone accessible in case the technician needs to reach you."}
        </p>
      </div>
    </Modal>
  );
}
