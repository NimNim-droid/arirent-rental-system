import { useState } from "react";
import type { CSSProperties } from "react";
import { Link, useNavigate } from "react-router";
import {
  DollarSign,
  Home,
  UserCheck,
  AlertCircle,
  Wrench,
  ArrowUpRight,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { SectionHeader } from "@/components/common/section-header";
import { StatsCard } from "@/components/common/stats-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { SkeletonCards, SkeletonRows } from "@/components/ui/skeleton";
import { useFakeLoading } from "@/lib/hooks";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const loading = useFakeLoading();
  const [selectedProperty, setSelectedProperty] = useState("all");

  const mockTickets = [
    {
      id: "T-101",
      room: "101",
      tenant: "Maria Santos",
      category: "Plumbing",
      issue: "Bathroom faucet leaking continuously",
      priority: "urgent",
      status: "pending",
      date: "2026-09-08",
    },
    {
      id: "T-102",
      room: "204",
      tenant: "Carlos Reyes",
      category: "Electrical",
      issue: "Kitchen ceiling light flickering",
      priority: "normal",
      status: "in_progress",
      date: "2026-09-07",
    },
    {
      id: "T-103",
      room: "302",
      tenant: "Elena Gomez",
      category: "Appliances",
      issue: "Aircon not blowing cold air",
      priority: "urgent",
      status: "resolved",
      date: "2026-09-05",
    },
  ];

  const occupancyByProperty = [
    { id: "prop-1", name: "AriRent Residences — Makati", occupied: 14, total: 15 },
    { id: "prop-2", name: "AriRent Heights — Quezon City", occupied: 9, total: 10 },
  ];

  const collection = { received: 126500, expected: 145000, pending: 18500 };

  const visibleProperties =
    selectedProperty === "all"
      ? occupancyByProperty
      : occupancyByProperty.filter((p) => p.id === selectedProperty);

  const occupiedTotal = visibleProperties.reduce((s, p) => s + p.occupied, 0);
  const totalUnits = visibleProperties.reduce((s, p) => s + p.total, 0);
  const occupancyOverall = totalUnits === 0 ? 0 : Math.round((occupiedTotal / totalUnits) * 100);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Overview of rental operations, occupancy, and pending tasks"
        action={
          <div className="w-full sm:w-56">
            <Select
              aria-label="Filter by property"
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
            >
              <option value="all">All Properties</option>
              <option value="prop-1">AriRent Residences — Makati</option>
              <option value="prop-2">AriRent Heights — Quezon City</option>
            </Select>
          </div>
        }
      />

      {/* Stats Grid */}
      {loading ? (
        <SkeletonCards cards={4} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatsCard
            title="Total Monthly Revenue"
            value="₱145,000"
            subtitle="September 2026"
            icon={<DollarSign className="h-5 w-5" />}
            trend={{ value: "+8.5%", isPositive: true }}
            delay={0}
            onClick={() => navigate("/admin/billing")}
          />
          <StatsCard
            title="Occupancy Rate"
            value={`${occupancyOverall}%`}
            subtitle={`${occupiedTotal} of ${totalUnits} units occupied`}
            icon={<Home className="h-5 w-5" />}
            trend={{ value: "+4.0%", isPositive: true }}
            delay={60}
            onClick={() => navigate("/admin/tenants")}
          />
          <StatsCard
            title="Pending Applications"
            value="3"
            subtitle="Awaiting admin approval"
            icon={<UserCheck className="h-5 w-5" />}
            delay={120}
            onClick={() => navigate("/admin/tenants")}
          />
          <StatsCard
            title="Pending GCash Payments"
            value={`₱${collection.pending.toLocaleString()}`}
            subtitle="4 receipts to verify"
            icon={<AlertCircle className="h-5 w-5 text-warning-fg" />}
            delay={180}
            onClick={() => navigate("/admin/billing")}
          />
        </div>
      )}

      {/* Occupancy & Collections */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card className="p-6 lg:col-span-2 animate-fade-in-up stagger" style={{ "--i": 0 } as CSSProperties}>
            <SectionHeader
              icon={<Users className="h-5 w-5" />}
              title="Occupancy by Property"
              subtitle="Current utilization of rental units"
            />
            <div className="mt-5 space-y-5">
              {visibleProperties.length === 0 ? (
                <p className="text-xs text-muted">No occupancy data for the selected property.</p>
              ) : (
                visibleProperties.map((property) => {
                  const pct = Math.round((property.occupied / property.total) * 100);
                  return (
                    <Link
                      key={property.id}
                      to="/admin/tenants"
                      className="group block rounded-xl px-3 py-2 -mx-3 transition-colors duration-200 hover:bg-hover"
                      aria-label={`View tenants at ${property.name}`}
                    >
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="font-semibold text-fg-soft transition-colors group-hover:text-fg">
                          {property.name}
                        </span>
                        <span className="text-xs font-bold text-muted tabular-nums">
                          {property.occupied}/{property.total} units
                        </span>
                      </div>
                      <div className="mt-2 flex h-2.5 w-full items-center overflow-hidden rounded-full bg-inset ring-1 ring-inset ring-edge">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="mt-1 text-right text-[11px] font-bold text-accent">
                        {pct}% <span className="font-medium text-faint">• manage tenants</span>
                      </p>
                    </Link>
                  );
                })
              )}
            </div>
          </Card>

          <Link to="/admin/billing" className="block group" aria-label="View billing and pending payments">
          <Card className="p-6 flex flex-col justify-between h-full animate-fade-in-up stagger duration-300 hover:-translate-y-0.5" style={{ "--i": 1 } as CSSProperties}>
            <SectionHeader
              icon={<DollarSign className="h-5 w-5" />}
              title="Collections"
              subtitle="September billing cycle"
            />
            <div className="mt-5">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-fg tabular-nums">
                  ₱{collection.received.toLocaleString()}
                </span>
                <span className="text-xs text-muted">of ₱{collection.expected.toLocaleString()}</span>
              </div>
              <div className="mt-3 flex h-2.5 w-full items-center overflow-hidden rounded-full bg-inset ring-1 ring-inset ring-edge">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                  style={{ width: `${Math.round((collection.received / collection.expected) * 100)}%` }}
                />
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted transition-colors group-hover:text-fg-soft">Pending verification</span>
                  <span className="font-bold text-warning-fg">
                    ₱{collection.pending.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Collected rate</span>
                  <span className="font-semibold text-fg-soft">
                    {Math.round((collection.received / collection.expected) * 100)}%
                  </span>
                </div>
              </div>
              <p className="mt-3 flex items-center gap-1 text-[11px] font-bold text-accent">
                Review payments <ArrowUpRight className="h-3 w-3" />
              </p>
            </div>
          </Card>
        </Link>
        </div>
      )}

      {/* Recent Maintenance Section */}
      <div className="space-y-4">
        <div className="animate-fade-in-up stagger" style={{ "--i": 0 } as CSSProperties}>
        <SectionHeader
          icon={<Wrench className="h-5 w-5" />}
          title="Recent Maintenance Requests"
          subtitle="Latest repair tickets across all properties"
          action={
            <Link to="/admin/maintenance">
              <Button variant="ghost" size="sm">
                View All Tickets
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
          }
        />

        <Card className="p-0 overflow-hidden animate-fade-in-up stagger" style={{ "--i": 1 } as CSSProperties}>
          {loading ? (
            <div className="p-5">
              <SkeletonRows rows={5} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Room & Tenant</TableHead>
                    <TableHead>Category & Issue</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockTickets.map((ticket, i) => (
                    <TableRow key={ticket.id} index={i} className="cursor-pointer" onClick={() => navigate("/admin/maintenance")}>
                      <TableCell className="font-bold text-accent">{ticket.id}</TableCell>
                      <TableCell>
                        <p className="font-semibold text-fg-soft">Room {ticket.room}</p>
                        <p className="text-xs text-muted">{ticket.tenant}</p>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-fg-soft">{ticket.category}</span>
                        <p className="max-w-[14rem] text-xs text-muted line-clamp-1">{ticket.issue}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={ticket.priority === "urgent" ? "danger" : "neutral"}>
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
                          {ticket.status}
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
          )}
        </Card>
      </div>
      </div>
    </div>
  );
}