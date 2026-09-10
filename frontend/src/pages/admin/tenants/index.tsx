import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import {
  UserCheck,
  UserX,
  Search,
  RefreshCw,
  AlertTriangle,
  LogOut,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { SectionHeader } from "@/components/common/section-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { SkeletonRows } from "@/components/ui/skeleton";
import { tenantsService } from "@/lib/services/tenants";
import { getErrorMessage } from "@/lib/errors";
import type { Tenant } from "@/lib/types";

function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = String(name)
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white ${className ?? ""}`}
    >
      {initials}
    </div>
  );
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminTenants() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadTenants = useCallback(async (search?: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await tenantsService.getTenants({ search, per_page: 200 });
      setTenants(res.data);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load tenants."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchTerm === "") {
        loadTenants(undefined);
      } else {
        loadTenants(searchTerm);
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const pendingApplicants = tenants.filter((t) => t.status === "pending_approval");
  const residents = tenants.filter((t) => t.status !== "pending_approval");

  const runAction = async (id: string, fn: () => Promise<void>) => {
    setBusyId(id);
    setError("");
    try {
      await fn();
      await loadTenants(searchTerm || undefined);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to update the tenant."));
    } finally {
      setBusyId(null);
    }
  };

  const handleApprove = (app: Tenant) =>
    runAction(app.id, () => tenantsService.approveTenant(app.id));

  const handleReject = (app: Tenant) =>
    runAction(app.id, () => tenantsService.rejectTenant(app.id));

  const handleVacate = (tenant: Tenant) => {
    setBusyId(tenant.id);
    void runAction(tenant.id, () => tenantsService.vacateTenant(tenant.id)).then(() => {
      setSelectedTenant(null);
    });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tenant Management"
        subtitle="Approve new registrations, manage active leases, and monitor resident accounts"
      />

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-xs font-semibold text-danger-fg">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </span>
          <Button variant="ghost" size="sm" onClick={() => loadTenants(searchTerm || undefined)}>
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      )}

      {/* Pending Applications Queue */}
      {!loading && !error && pendingApplicants.length > 0 && (
        <div className="space-y-4 animate-fade-in-up stagger" style={{ "--i": 0 } as CSSProperties}>
          <SectionHeader
            dot
            dotClassName="text-warning-fg"
            title={`Pending Applications (${pendingApplicants.length})`}
            subtitle="New tenant registrations awaiting your approval"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingApplicants.map((app, i) => (
              <Card
                key={app.id}
                className="p-5 border-warning-border animate-fade-in-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-fg">{app.name}</h3>
                    <p className="text-xs text-muted mt-0.5">
                      Applied: {formatDate(app.created_at)}
                    </p>
                    <div className="mt-3 space-y-1 text-xs text-muted">
                      <p>
                        <strong className="text-fg-soft">Room Requested:</strong>{" "}
                        {app.room} ({app.property_name})
                      </p>
                      <p className="truncate">
                        <strong className="text-fg-soft">Contact:</strong> {app.phone} • {app.email}
                      </p>
                    </div>
                  </div>
                  <Badge variant="warning" dot>
                    Awaiting Approval
                  </Badge>
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-warning-border/50 pt-3">
                  <Button
                    size="sm"
                    className="flex-1"
                    loading={busyId === app.id}
                    onClick={() => handleApprove(app)}
                  >
                    {busyId !== app.id && (
                      <>
                        <UserCheck className="h-4 w-4" />
                        Approve
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={busyId === app.id && selectedTenant === null}
                    onClick={() => handleReject(app)}
                    className="text-danger-fg hover:bg-danger-bg hover:border-danger-border hover:text-danger-fg"
                  >
                    {busyId !== app.id && (
                      <>
                        <UserX className="h-4 w-4" />
                        Decline
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Active Residents Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up stagger" style={{ "--i": 1 } as CSSProperties}>
          <h2 className="text-lg font-bold tracking-tight text-fg">
            Residents ({residents.length})
          </h2>
          <Input
            icon={<Search className="h-4 w-4" />}
            placeholder="Search by name, room..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-72"
            aria-label="Search residents"
          />
        </div>

        <Card className="p-0 overflow-hidden animate-fade-in-up stagger" style={{ "--i": 2 } as CSSProperties}>
          {loading ? (
            <div className="p-5">
              <SkeletonRows rows={5} />
            </div>
          ) : residents.length === 0 ? (
            <EmptyState
              title="No residents found"
              description="Try adjusting your search or approving a pending application."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resident</TableHead>
                    <TableHead>Room & Building</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Lease Ends</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {residents.map((t, i) => (
                    <TableRow key={t.id} index={i}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar name={t.name} />
                          <p className="font-bold text-fg">{t.name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold text-fg-soft">Room {t.room}</p>
                        <p className="text-xs text-muted">{t.property_name}</p>
                      </TableCell>
                      <TableCell className="text-xs text-muted">
                        <p>{t.phone}</p>
                        <p className="text-faint">{t.email}</p>
                      </TableCell>
                      <TableCell className="text-xs font-medium text-fg-soft whitespace-nowrap">
                        {formatDate(t.lease_end)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {t.balance > 0 ? (
                          <span className="font-bold text-warning-fg">
                            ₱{t.balance.toLocaleString()}
                          </span>
                        ) : (
                          <span className="font-semibold text-success-fg">₱0.00</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {t.status === "active" ? (
                          <Badge variant="success" dot>Active</Badge>
                        ) : (
                          <Badge variant="neutral" dot>Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTenant(t)}
                          className="text-accent hover:text-accent-strong"
                        >
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>

      {/* Tenant Detail Modal */}
      {selectedTenant && (
        <Modal
          open={!!selectedTenant}
          onClose={() => setSelectedTenant(null)}
          title={`Resident Profile: ${selectedTenant.name}`}
          footer={
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedTenant(null)}
              >
                Close
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={busyId === selectedTenant.id}
                onClick={() => handleVacate(selectedTenant)}
              >
                {busyId !== selectedTenant.id && (
                  <>
                    <LogOut className="h-4 w-4" />
                    End Lease / Vacate Unit
                  </>
                )}
              </Button>
            </>
          }
        >
          {error && (
            <div className="mb-4 rounded-xl border border-danger-border bg-danger-bg px-3 py-2 text-xs font-semibold text-danger-fg">
              {error}
            </div>
          )}
          <div className="flex items-center gap-3 pb-4">
            <Avatar name={selectedTenant.name} className="h-12 w-12 text-sm" />
            <div>
              <p className="font-bold text-fg">{selectedTenant.name}</p>
              <p className="text-xs text-muted">{selectedTenant.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 rounded-xl bg-inset p-4 text-sm">
            <div>
              <p className="text-xs text-muted">Assigned Unit</p>
              <p className="font-bold text-fg">Room {selectedTenant.room}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Property</p>
              <p className="font-bold text-fg">{selectedTenant.property_name}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Monthly Water Rate</p>
              <p className="font-bold text-fg">₱{selectedTenant.water_rate}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Lease Expiration</p>
              <p className="font-bold text-fg">{formatDate(selectedTenant.lease_end)}</p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}