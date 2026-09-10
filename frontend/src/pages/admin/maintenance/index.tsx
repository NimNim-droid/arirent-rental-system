import { useState } from "react";
import type { CSSProperties } from "react";
import { CheckCircle2, UserCheck, SearchX } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonCards } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import { useFakeLoading } from "@/lib/hooks";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
];

export default function AdminMaintenance() {
  const loading = useFakeLoading();
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
      <div className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl border border-edge bg-inset p-1 animate-fade-in-up stagger" style={{ "--i": 0 } as CSSProperties}>
        {FILTERS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              filter === tab.value
                ? "bg-accent-soft text-accent ring-1 ring-inset ring-accent-border"
                : "text-muted hover:text-fg"
            )}
          >
            {tab.label}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                filter === tab.value ? "bg-accent text-white" : "bg-hover text-muted"
              )}
            >
              {tab.value === "all"
                ? tickets.length
                : tickets.filter((t) => t.status === tab.value).length}
            </span>
          </button>
        ))}
      </div>

      {/* Ticket List */}
      {loading ? (
        <SkeletonCards cards={3} />
      ) : filteredTickets.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            icon={<SearchX className="h-6 w-6" />}
            title="No tickets here"
            description={`There are no ${filter.replace("_", " ")} maintenance tickets right now.`}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTickets.map((t, i) => (
            <Card key={t.id} className="flex flex-col justify-between space-y-4 p-5 animate-fade-in-up stagger" style={{ "--i": i + 1 } as CSSProperties}>
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-accent">{t.id}</span>
                  <Badge variant={t.priority === "urgent" ? "danger" : "neutral"} dot>
                    {t.priority}
                  </Badge>
                </div>

                <div className="mt-3">
                  <h3 className="text-base font-bold text-fg">Room {t.room}</h3>
                  <p className="text-xs text-muted">Tenant: {t.tenant} • {t.date}</p>
                </div>

                <div className="mt-2 rounded-xl border border-edge bg-inset p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                    {t.type}
                  </p>
                  <p className="mt-1 text-sm text-fg-soft">{t.description}</p>
                </div>

                {t.technician && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-muted">
                    <UserCheck className="h-4 w-4 text-success-fg" />
                    Assigned Tech: <strong className="text-fg-soft">{t.technician}</strong>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 border-t border-edge pt-3">
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
                  <Badge variant="success" dot className="w-full justify-center py-1">
                    Resolved
                  </Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Dispatch Modal */}
      {activeTicket && (
        <Modal
          open={!!activeTicket}
          onClose={() => setActiveTicket(null)}
          title={`Dispatch Technician — ${activeTicket.id}`}
          footer={
            <>
              <Button type="button" variant="secondary" onClick={() => setActiveTicket(null)}>
                Cancel
              </Button>
              <Button type="submit" form="dispatch-form">
                Confirm Dispatch
              </Button>
            </>
          }
        >
          <form id="dispatch-form" onSubmit={handleDispatch} className="space-y-4">
            <p className="text-xs text-muted">
              Assign a maintenance personnel to Room <strong className="text-fg">{activeTicket.room}</strong> for{" "}
              {activeTicket.type}.
            </p>

            <Input
              id="techName"
              label="Technician Name"
              placeholder="e.g. Kuya Roger (Electrician)"
              value={techName}
              onChange={(e) => setTechName(e.target.value)}
              required
              autoFocus
            />

            <Textarea
              id="adminNotes"
              label="Instructions / Notes"
              placeholder="Scheduled for tomorrow at 10:00 AM..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
            />
          </form>
        </Modal>
      )}
    </div>
  );
}