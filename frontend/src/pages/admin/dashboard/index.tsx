import { useEffect, useState } from "react";
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
  RefreshCw,
  AlertTriangle,
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
import { dashboardService } from "@/lib/services/dashboard";
import { propertiesService } from "@/lib/services/properties";
import { useAuth } from "@/lib/auth-context";
import { getErrorMessage } from "@/lib/errors";
import type { DashboardStats, Property, MaintenanceTicket } from "@/lib/types";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, initializing } = useAuth();
  const [selectedProperty, setSelectedProperty] = useState("all");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [statsRes, propsRes] = await Promise.all([
        dashboardService.getAdminStats(
          selectedProperty === "all" ? undefined : { property_id: selectedProperty }
        ),
        propertiesService.getProperties(),
      ]);
      setStats(statsRes);
      setProperties(propsRes);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load dashboard data."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initializing) {
      if (!user) {
        navigate("/login");
        return;
      }
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, initializing, selectedProperty]);

  const visibleProperties =
    selectedProperty === "all"
      ? properties
      : properties.filter((p) => p.id === selectedProperty);

  const occupiedTotal = visibleProperties.reduce(
    (s, p) => s + (p.occupied_count ?? 0),
    0
  );
  const totalUnits = visibleProperties.reduce((s, p) => s + (p.rooms_count ?? 0), 0);
  const occupancyOverall =
    totalUnits === 0
      ? stats?.occupancy_rate ?? 0
      : Math.round((occupiedTotal / totalUnits) * 100);

  const ticketId = (t: MaintenanceTicket) =>
    /^\d+$/.test(t.id) ? `#${t.id}` : t.id;

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
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.city}
                </option>
              ))}
            </Select>
          </div>
        }
      />

      {/* Stats Grid */}
      {loading ? (
        <SkeletonCards cards={4} />
      ) : error ? (
        <Card className="p-6 text-center space-y-3">
          <AlertTriangle className="mx-auto h-8 w-8 text-warning-fg" />
          <p className="text-sm font-semibold text-fg">{error}</p>
          <Button variant="secondary" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </Card>
      ) : stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatsCard
            title="Monthly Revenue"
            value={`₱${stats.total_revenue.toLocaleString()}`}
            subtitle="Total collections registered"
            icon={<DollarSign className="h-5 w-5" />}
            delay={0}
            onClick={() => navigate("/admin/billing")}
          />
          <StatsCard
            title="Occupancy Rate"
            value={`${stats.occupancy_rate}%`}
            subtitle={`${stats.occupied_rooms} of ${stats.total_rooms} units occupied`}
            icon={<Home className="h-5 w-5" />}
            delay={60}
            onClick={() => navigate("/admin/tenants")}
          />
          <StatsCard
            title="Pending Applications"
            value={String(stats.pending_applications)}
            subtitle="Awaiting admin approval"
            icon={<UserCheck className="h-5 w-5" />}
            delay={120}
            onClick={() => navigate("/admin/tenants")}
          />
          <StatsCard
            title="Pending GCash Payments"
            value={String(stats.pending_payments)}
            subtitle="Receipts to verify"
            icon={<AlertCircle className="h-5 w-5 text-warning-fg" />}
            delay={180}
            onClick={() => navigate("/admin/billing")}
          />
        </div>
      ) : null}

      {/* Occupancy & Collections */}
      {!loading && !error && stats && (
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
                  const occupied = property.occupied_count ?? 0;
                  const total = property.rooms_count ?? 0;
                  const pct = total === 0 ? 0 : Math.round((occupied / total) * 100);
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
                          {occupied}/{total} units
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
            <Card
              className="p-6 flex flex-col justify-between h-full animate-fade-in-up stagger duration-300 hover:-translate-y-0.5"
              style={{ "--i": 1 } as CSSProperties}
            >
              <SectionHeader
                icon={<DollarSign className="h-5 w-5" />}
                title="Collections"
                subtitle="Registered collections"
              />
              <div className="mt-5">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-fg tabular-nums">
                    ₱{stats.total_revenue.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted">
                    {stats.pending_payments} pending
                  </span>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted transition-colors group-hover:text-fg-soft">
                      Pending verification
                    </span>
                    <span className="font-bold text-warning-fg">
                      {stats.pending_payments} receipts
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">Occupancy</span>
                    <span className="font-semibold text-fg-soft">
                      {stats.occupancy_rate}%
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
            ) : error ? (
              <div className="p-6 text-center space-y-3">
                <AlertTriangle className="mx-auto h-8 w-8 text-warning-fg" />
                <p className="text-sm font-semibold text-fg">{error}</p>
                <Button variant="secondary" size="sm" onClick={loadData}>
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </Button>
              </div>
            ) : stats && stats.recent_maintenance.length > 0 ? (
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
                    {stats.recent_maintenance.map((ticket, i) => (
                      <TableRow
                        key={ticket.id}
                        index={i}
                        className="cursor-pointer"
                        onClick={() => navigate("/admin/maintenance")}
                      >
                        <TableCell className="font-bold text-accent">
                          {ticketId(ticket)}
                        </TableCell>
                        <TableCell>
                          <p className="font-semibold text-fg-soft">Room {ticket.room}</p>
                          <p className="text-xs text-muted">{ticket.tenant_name}</p>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-fg-soft">
                            {ticket.type}
                          </span>
                          <p className="max-w-[14rem] text-xs text-muted line-clamp-1">
                            {ticket.description}
                          </p>
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
            ) : stats && stats.recent_maintenance.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm font-semibold text-fg-soft">No maintenance requests yet</p>
                <p className="mt-1 text-xs text-muted">
                  Maintenance tickets will appear here once submitted.
                </p>
              </div>
            ) : null}
          </Card>
        </div>
      </div>
    </div>
  );
}