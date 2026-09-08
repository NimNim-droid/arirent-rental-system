import { useState } from "react";
import { UserCheck, UserX, Search, Filter, Phone, Mail, Eye } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

export default function AdminTenants() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<any>(null);

  // Mock pending applicants
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

  // Mock active tenants
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
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
            <h2 className="text-base font-bold text-slate-900">
              Pending Applications ({pendingApplicants.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingApplicants.map((app) => (
              <Card key={app.id} className="p-5 border-amber-200 bg-amber-50/30">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900">{app.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Applied: {app.appliedDate}</p>
                    <div className="mt-3 space-y-1 text-xs text-slate-600">
                      <p>
                        <strong className="text-slate-700">Room Requested:</strong> {app.room} ({app.property})
                      </p>
                      <p>
                        <strong className="text-slate-700">Contact:</strong> {app.phone} • {app.email}
                      </p>
                    </div>
                  </div>
                  <Badge variant="warning">Awaiting Approval</Badge>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-amber-200/50">
                  <Button size="sm" onClick={() => handleApprove(app)} className="flex-1">
                    <UserCheck className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleReject(app.id)}
                    className="text-red-600 hover:bg-red-50"
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-900">Active Residents ({tenants.length})</h2>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, room..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 shadow-xs"
            />
          </div>
        </div>

        <Card className="p-0 overflow-hidden border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="p-4">Resident</th>
                  <th className="p-4">Room & Building</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Lease Ends</th>
                  <th className="p-4">Balance</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredTenants.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-slate-900">{t.name}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-slate-800">Room {t.room}</p>
                      <p className="text-xs text-slate-400">{t.property}</p>
                    </td>
                    <td className="p-4 text-xs text-slate-600">
                      <p>{t.phone}</p>
                      <p className="text-slate-400">{t.email}</p>
                    </td>
                    <td className="p-4 text-xs font-medium text-slate-700">{t.leaseEnd}</td>
                    <td className="p-4">
                      {t.balance > 0 ? (
                        <span className="font-bold text-amber-600">₱{t.balance.toLocaleString()}</span>
                      ) : (
                        <span className="font-semibold text-emerald-600">₱0.00 (Clear)</span>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge variant="success">Active</Badge>
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTenant(t)}
                        className="text-sky-600 hover:text-sky-700"
                      >
                        <Eye className="h-4 w-4" />
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Tenant Detail Modal */}
      {selectedTenant && (
        <Modal
          open={!!selectedTenant}
          onClose={() => setSelectedTenant(null)}
          title={`Resident Profile: ${selectedTenant.name}`}
        >
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="text-xs text-slate-400">Assigned Unit</p>
                <p className="font-bold text-slate-800">Room {selectedTenant.room}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Property</p>
                <p className="font-bold text-slate-800">{selectedTenant.property}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Monthly Water Rate</p>
                <p className="font-bold text-slate-800">₱{selectedTenant.waterRate}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Lease Expiration</p>
                <p className="font-bold text-slate-800">{selectedTenant.leaseEnd}</p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
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
              <Button variant="secondary" size="sm" onClick={() => setSelectedTenant(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
