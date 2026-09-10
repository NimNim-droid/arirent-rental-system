import { useState } from "react";
import type { CSSProperties } from "react";
import { UserCheck, UserX, Search } from "lucide-react";
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
import { useFakeLoading } from "@/lib/hooks";

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

export default function AdminTenants() {
  const loading = useFakeLoading();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<any>(null);

  const [pendingApplicants, setPendingApplicants] = useState([
    {
      id: "app-1",
      name: "Juan Miguel",
      email: "juan.m@example.com",
      phone: "0918-333-4444",
      room: "105",
      property: "AriRent Residences - Makati",
      appliedDate: "2026-09-07",
    },
    {
      id: "app-2",
      name: "Angela De Silva",
      email: "angela@example.com",
      phone: "0920-555-8888",
      room: "201",
      property: "AriRent Heights - Quezon City",
      appliedDate: "2026-09-08",
    },
  ]);

  const [tenants, setTenants] = useState([
    {
      id: "t-1",
      name: "Maria Santos",
      email: "maria@example.com",
      phone: "0917-123-4567",
      room: "101",
      property: "AriRent Residences - Makati",
      status: "active",
      balance: 0,
      waterRate: 500,
      leaseEnd: "2027-01-15",
    },
    {
      id: "t-2",
      name: "Carlos Reyes",
      email: "carlos@example.com",
      phone: "0918-987-6543",
      room: "204",
      property: "AriRent Residences - Makati",
      status: "active",
      balance: 5500,
      waterRate: 500,
      leaseEnd: "2026-12-31",
    },
    {
      id: "t-3",
      name: "Elena Gomez",
      email: "elena@example.com",
      phone: "0922-456-7890",
      room: "302",
      property: "AriRent Heights - Quezon City",
      status: "active",
      balance: 0,
      waterRate: 600,
      leaseEnd: "2027-03-31",
    },
  ]);

  const handleApprove = (applicant: any) => {
    setTenants([
      ...tenants,
      {
        id: applicant.id,
        name: applicant.name,
        email: applicant.email,
        phone: applicant.phone,
        room: applicant.room,
        property: applicant.property,
        status: "active",
        balance: 0,
        waterRate: 500,
        leaseEnd: "2027-09-01",
      },
    ]);
    setPendingApplicants(pendingApplicants.filter((a) => a.id !== applicant.id));
  };

  const handleReject = (id: string) => {
    setPendingApplicants(pendingApplicants.filter((a) => a.id !== id));
  };

  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tenant Management"
        subtitle="Approve new registrations, manage active leases, and monitor resident accounts"
      />

      {/* Pending Applications Queue */}
      {pendingApplicants.length > 0 && (
        <div className="space-y-4 animate-fade-in-up stagger" style={{ "--i": 0 } as CSSProperties}>
          <SectionHeader
            dot
            dotClassName="text-warning-fg"
            title={`Pending Applications (${pendingApplicants.length})`}
            subtitle="New tenant registrations awaiting your approval"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingApplicants.map((app, i) => (
              <Card key={app.id} className="p-5 border-warning-border animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-fg">{app.name}</h3>
                    <p className="text-xs text-muted mt-0.5">Applied: {app.appliedDate}</p>
                    <div className="mt-3 space-y-1 text-xs text-muted">
                      <p>
                        <strong className="text-fg-soft">Room Requested:</strong> {app.room} ({app.property})
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
                  <Button size="sm" onClick={() => handleApprove(app)} className="flex-1">
                    <UserCheck className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleReject(app.id)}
                    className="text-danger-fg hover:bg-danger-bg hover:border-danger-border hover:text-danger-fg"
                  >
                    <UserX className="h-4 w-4" />
                    Decline
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
            Active Residents ({tenants.length})
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
                  {filteredTenants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <EmptyState
                          title="No residents found"
                          description="Try adjusting your search or approving a pending application."
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTenants.map((t, i) => (
                      <TableRow key={t.id} index={i}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar name={t.name} />
                            <p className="font-bold text-fg">{t.name}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-semibold text-fg-soft">Room {t.room}</p>
                          <p className="text-xs text-muted">{t.property}</p>
                        </TableCell>
                        <TableCell className="text-xs text-muted">
                          <p>{t.phone}</p>
                          <p className="text-faint">{t.email}</p>
                        </TableCell>
                        <TableCell className="text-xs font-medium text-fg-soft whitespace-nowrap">
                          {t.leaseEnd}
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
                          <Badge variant="success" dot>Active</Badge>
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
                    ))
                  )}
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
                onClick={() => {
                  setTenants(tenants.filter((t) => t.id !== selectedTenant.id));
                  setSelectedTenant(null);
                }}
              >
                End Lease / Vacate Unit
              </Button>
            </>
          }
        >
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
              <p className="font-bold text-fg">{selectedTenant.property}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Monthly Water Rate</p>
              <p className="font-bold text-fg">₱{selectedTenant.waterRate}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Lease Expiration</p>
              <p className="font-bold text-fg">{selectedTenant.leaseEnd}</p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}