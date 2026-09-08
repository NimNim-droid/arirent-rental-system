import { useState } from "react";
import { DollarSign, Home, UserCheck, AlertCircle, Wrench, Plus } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { StatsCard } from "@/components/common/stats-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
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

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Overview of rental operations, occupancy, and pending tasks"
        action={
          <select
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 shadow-xs"
          >
            <option value="all">All Properties</option>
            <option value="prop-1">AriRent Residences - Makati</option>
            <option value="prop-2">AriRent Heights - Quezon City</option>
          </select>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="Total Monthly Revenue"
          value="₱145,000"
          subtitle="September 2026"
          icon={<DollarSign className="h-6 w-6" />}
          trend={{ value: "+8.5%", isPositive: true }}
        />
        <StatsCard
          title="Occupancy Rate"
          value="92%"
          subtitle="23 of 25 units occupied"
          icon={<Home className="h-6 w-6" />}
          trend={{ value: "+4.0%", isPositive: true }}
        />
        <StatsCard
          title="Pending Applications"
          value="3"
          subtitle="Awaiting admin approval"
          icon={<UserCheck className="h-6 w-6" />}
        />
        <StatsCard
          title="Pending GCash Payments"
          value="₱18,500"
          subtitle="4 receipts to verify"
          icon={<AlertCircle className="h-6 w-6 text-amber-600" />}
        />
      </div>

      {/* Recent Maintenance Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-sky-600" />
            <h2 className="text-lg font-bold text-slate-900">Recent Maintenance Requests</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={() => window.location.href = "/admin/maintenance"}>
            View All Tickets →
          </Button>
        </div>

        <Card className="p-0 overflow-hidden border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="p-4">Ticket</th>
                  <th className="p-4">Room & Tenant</th>
                  <th className="p-4">Category & Issue</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {mockTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-sky-600">{ticket.id}</td>
                    <td className="p-4">
                      <p className="font-semibold text-slate-800">Room {ticket.room}</p>
                      <p className="text-xs text-slate-400">{ticket.tenant}</p>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-slate-700">{ticket.category}</span>
                      <p className="text-xs text-slate-500 line-clamp-1">{ticket.issue}</p>
                    </td>
                    <td className="p-4">
                      <Badge variant={ticket.priority === "urgent" ? "danger" : "neutral"}>
                        {ticket.priority}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge
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
                    </td>
                    <td className="p-4 text-xs text-slate-500">{ticket.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
