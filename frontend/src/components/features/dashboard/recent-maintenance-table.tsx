import { Link, useNavigate } from "react-router";
import { Wrench, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/common/section-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { SkeletonRows } from "@/components/ui/skeleton";
import type { MaintenanceTicket } from "@/lib/types";

interface RecentMaintenanceTableProps {
  tickets: MaintenanceTicket[];
  loading: boolean;
}

export function RecentMaintenanceTable({
  tickets,
  loading,
}: RecentMaintenanceTableProps) {
  const navigate = useNavigate();
  const formatId = (t: MaintenanceTicket) =>
    /^\d+$/.test(t.id) ? `#${t.id}` : t.id;

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={<Wrench className="h-5 w-5" />}
        title="Recent Maintenance Requests"
        subtitle="Latest repair tickets across properties requiring dispatch or follow-up"
        action={
          <Link to="/admin/maintenance">
            <Button variant="ghost" size="sm" className="text-xs">
              View All Tickets
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        }
      />

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-5">
            <SkeletonRows rows={4} />
          </div>
        ) : tickets.length > 0 ? (
          <div className="table-scroll-wrap">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Room & Resident</TableHead>
                  <TableHead>Category & Issue</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow
                    key={ticket.id}
                    className="cursor-pointer"
                    onClick={() => navigate("/admin/maintenance")}
                  >
                    <TableCell className="font-mono font-bold text-accent">
                      {formatId(ticket)}
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold text-fg-soft">
                        Room {ticket.room}
                      </p>
                      <p className="text-xs text-muted">{ticket.tenant_name}</p>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-fg-soft capitalize">
                        {ticket.type}
                      </span>
                      <p className="max-w-[14rem] text-xs text-muted line-clamp-1">
                        {ticket.description}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={ticket.priority === "urgent" ? "danger" : "neutral"}
                        dot
                      >
                        {ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        dot
                        variant={
                          ticket.status === "resolved"
                            ? "success"
                            : ticket.status === "in_progress"
                            ? "warning"
                            : "info"
                        }
                      >
                        {ticket.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted whitespace-nowrap">
                      {ticket.date}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm font-semibold text-fg-soft">
              No maintenance requests yet
            </p>
            <p className="mt-1 text-xs text-muted">
              Maintenance tickets will appear here once submitted by residents.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
