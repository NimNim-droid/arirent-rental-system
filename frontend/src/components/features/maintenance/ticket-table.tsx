import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TicketPriorityBadge, TicketStatusBadge } from "./ticket-badges";
import { formatDate, formatTime } from "@/lib/formatters";
import { cn } from "@/lib/cn";
import type { MaintenanceTicket } from "@/lib/types";

interface TicketTableProps {
  tickets: MaintenanceTicket[];
  selectedId: string | null;
  onSelect: (ticket: MaintenanceTicket) => void;
}

export function TicketTable({ tickets, selectedId, onSelect }: TicketTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[720px]">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-16">ID</TableHead>
            <TableHead>Tenant</TableHead>
            <TableHead>Property / Room</TableHead>
            <TableHead className="min-w-[180px]">Issue</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date Submitted</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => {
            const isSelected = ticket.id === selectedId;
            return (
              <TableRow
                key={ticket.id}
                onClick={() => onSelect(ticket)}
                className={cn(
                  "cursor-pointer",
                  isSelected && "bg-accent-soft/50 hover:bg-accent-soft/50"
                )}
              >
                <TableCell className="font-bold text-fg whitespace-nowrap">
                  #{ticket.id}
                </TableCell>
                <TableCell>
                  <div className="font-semibold text-fg">{ticket.tenant_name ?? "—"}</div>
                  <div className="text-[11px] text-muted">Room {ticket.room}</div>
                </TableCell>
                <TableCell>
                  <div className="text-fg-soft">{ticket.property_name ?? "—"}</div>
                  <div className="text-[11px] text-muted">Room {ticket.room}</div>
                </TableCell>
                <TableCell>
                  <p className="line-clamp-2 max-w-[220px] text-fg-soft">{ticket.description}</p>
                </TableCell>
                <TableCell>
                  <TicketPriorityBadge priority={ticket.priority} />
                </TableCell>
                <TableCell>
                  <TicketStatusBadge status={ticket.status} />
                </TableCell>
                <TableCell>
                  <div className="text-fg-soft whitespace-nowrap">{formatDate(ticket.date)}</div>
                  <div className="text-[11px] text-muted">{formatTime(ticket.created_at)}</div>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(ticket);
                    }}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
