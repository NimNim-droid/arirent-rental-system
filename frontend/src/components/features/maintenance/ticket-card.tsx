import { CheckCircle2, UserCheck, Archive } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MaintenanceTicket } from "@/lib/types";

interface TicketCardProps {
  ticket: MaintenanceTicket;
  busyId: string | null;
  onDispatch: (ticket: MaintenanceTicket) => void;
  onResolve: (id: string) => void;
  onArchive: (id: string) => void;
}

export function TicketCard({
  ticket,
  busyId,
  onDispatch,
  onResolve,
  onArchive,
}: TicketCardProps) {
  const formattedId = /^\d+$/.test(ticket.id) ? `#${ticket.id}` : ticket.id;

  return (
    <Card className="flex flex-col justify-between space-y-4 p-5">
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs font-bold text-accent">
            {formattedId}
          </span>
          <Badge
            variant={ticket.priority === "urgent" ? "danger" : "neutral"}
            dot
          >
            {ticket.priority}
          </Badge>
        </div>

        <div className="mt-3">
          <h3 className="text-base font-bold text-fg">Room {ticket.room}</h3>
          <p className="text-xs text-muted">
            Tenant: {ticket.tenant_name} • {ticket.date}
          </p>
        </div>

        <div className="mt-2 rounded-xl border border-edge bg-inset p-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
            {ticket.type}
          </p>
          <p className="mt-1 text-sm text-fg-soft">{ticket.description}</p>
        </div>

        <div className="mt-3 space-y-1.5">
          {ticket.technician_name && (
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <UserCheck className="h-4 w-4 text-success-fg" />
              Assigned Tech:{" "}
              <strong className="text-fg-soft">{ticket.technician_name}</strong>
            </div>
          )}
          {ticket.admin_notes && (
            <p className="text-xs text-muted italic">"{ticket.admin_notes}"</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-edge pt-3">
        {ticket.status !== "resolved" ? (
          <>
            <Button
              size="sm"
              variant="secondary"
              className="flex-1 text-xs"
              onClick={() => onDispatch(ticket)}
            >
              Dispatch Tech
            </Button>
            <Button
              size="sm"
              className="flex-1 text-xs"
              loading={busyId === ticket.id}
              onClick={() => onResolve(ticket.id)}
            >
              {busyId !== ticket.id && (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Resolved
                </>
              )}
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            className="w-full text-xs text-muted-foreground hover:text-foreground"
            loading={busyId === `archive-${ticket.id}`}
            onClick={() => onArchive(ticket.id)}
          >
            {busyId !== `archive-${ticket.id}` && (
              <>
                <Archive className="h-3.5 w-3.5" />
                Archive
              </>
            )}
          </Button>
        )}
      </div>
    </Card>
  );
}
