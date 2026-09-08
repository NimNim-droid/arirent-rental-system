import { useState } from "react";
import { Wrench, CheckCircle2, Clock, UserCheck, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function AdminMaintenance() {
  const [filter, setFilter] = useState("all");
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [techName, setTechName] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  const [tickets, setTickets] = useState([
    {
      id: "T-101",
      room: "101",
      tenant: "Maria Santos",
      type: "plumbing",
      description: "Bathroom sink pipe leaking water on floor.",
      priority: "urgent",
      status: "pending",
      date: "2026-09-08",
      technician: "",
    },
    {
      id: "T-102",
      room: "204",
      tenant: "Carlos Reyes",
      type: "electrical",
      description: "Light switch in bedroom not working.",
      priority: "normal",
      status: "in_progress",
      date: "2026-09-07",
      technician: "Kuya Roger",
    },
    {
      id: "T-103",
      room: "302",
      tenant: "Elena Gomez",
      type: "appliances",
      description: "Air conditioner making loud buzzing sound.",
      priority: "urgent",
      status: "resolved",
      date: "2026-09-05",
      technician: "Tech Master Alex",
    },
  ]);

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    setTickets(
      tickets.map((t) =>
        t.id === activeTicket.id
          ? { ...t, status: "in_progress", technician: techName }
          : t
      )
    );
    setActiveTicket(null);
  };

  const handleMarkResolved = (id: string) => {
    setTickets(
      tickets.map((t) => (t.id === id ? { ...t, status: "resolved" } : t))
    );
  };

  const filteredTickets =
    filter === "all" ? tickets : tickets.filter((t) => t.status === filter);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Maintenance Dispatch"
        subtitle="Review tenant repair requests, dispatch technicians, and track resolution status"
      />

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-3">
        {["all", "pending", "in_progress", "resolved"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              filter === tab
                ? "bg-sky-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Ticket List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTickets.map((t) => (
          <Card key={t.id} className="p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-sky-600">{t.id}</span>
                <Badge variant={t.priority === "urgent" ? "danger" : "neutral"}>
                  {t.priority}
                </Badge>
              </div>

              <div className="mt-3">
                <h3 className="font-bold text-slate-900 text-base">Room {t.room}</h3>
                <p className="text-xs text-slate-400">Tenant: {t.tenant} • {t.date}</p>
              </div>

              <div className="mt-2 p-3 bg-slate-50 rounded-xl">
                <p className="text-xs font-semibold text-slate-500 uppercase">{t.type}</p>
                <p className="text-sm text-slate-700 mt-1">{t.description}</p>
              </div>

              {t.technician && (
                <div className="mt-3 text-xs text-slate-600 flex items-center gap-1.5">
                  <UserCheck className="h-4 w-4 text-emerald-600" />
                  Assigned Tech: <strong className="text-slate-800">{t.technician}</strong>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
              {t.status !== "resolved" ? (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1 text-xs"
                    onClick={() => {
                      setActiveTicket(t);
                      setTechName(t.technician || "");
                    }}
                  >
                    Dispatch Tech
                  </Button>
                  <Button
                    size="sm"
                    className="text-xs"
                    onClick={() => handleMarkResolved(t.id)}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Resolved
                  </Button>
                </>
              ) : (
                <Badge variant="success" className="w-full justify-center py-1">
                  Resolved
                </Badge>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Dispatch Modal */}
      {activeTicket && (
        <Modal
          open={!!activeTicket}
          onClose={() => setActiveTicket(null)}
          title={`Dispatch Technician — ${activeTicket.id}`}
        >
          <form onSubmit={handleDispatch} className="space-y-4">
            <p className="text-xs text-slate-500">
              Assign a maintenance personnel to Room <strong>{activeTicket.room}</strong> for{" "}
              {activeTicket.type}.
            </p>

            <Input
              id="techName"
              label="Technician Name"
              placeholder="e.g. Kuya Roger (Electrician)"
              value={techName}
              onChange={(e) => setTechName(e.target.value)}
              required
            />

            <Textarea
              id="adminNotes"
              label="Instructions / Notes"
              placeholder="Scheduled for tomorrow at 10:00 AM..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={() => setActiveTicket(null)}>
                Cancel
              </Button>
              <Button type="submit">Confirm Dispatch</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
