import { useState } from "react";
import type { CSSProperties } from "react";
import { Phone, Send, ClipboardList, Wrench, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { SectionHeader } from "@/components/common/section-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";

export default function TenantMaintenance() {
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [issueType, setIssueType] = useState("plumbing");
  const [submitted, setSubmitted] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  const [tickets, setTickets] = useState([
    {
      id: "T-101",
      type: "plumbing",
      description: "Bathroom sink pipe leaking water on floor.",
      priority: "urgent",
      status: "pending",
      date: "2026-09-08",
    },
    {
      id: "T-098",
      type: "electrical",
      description: "Replaced broken ceiling light fixture.",
      priority: "normal",
      status: "resolved",
      date: "2026-08-21",
    },
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTickets([
      {
        id: `T-${Math.floor(100 + Math.random() * 900)}`,
        type: issueType,
        description: details || subject,
        priority: "normal",
        status: "pending",
        date: new Date().toISOString().slice(0, 10),
      },
      ...tickets,
    ]);
    setSubject("");
    setDetails("");
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Maintenance Requests"
        subtitle="Submit repair requests anytime — our team responds within 24 hours"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* New Request Form */}
        <Card className="p-6 animate-fade-in-up stagger" style={{ "--i": 0 } as CSSProperties}>
          <SectionHeader
            icon={<Wrench className="h-5 w-5" />}
            title="Submit a Repair Request"
            subtitle="Describe the issue and our technician will be dispatched"
          />

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <Select
              id="type"
              label="Issue Type"
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
            >
              <option value="plumbing">Plumbing (sink, toilet, pipe)</option>
              <option value="electrical">Electrical (lights, outlets, switch)</option>
              <option value="appliances">Appliances (AC, fridge, water heater)</option>
              <option value="structural">Structural (wall, ceiling, door, window)</option>
              <option value="pest">Pest / Sanitation</option>
              <option value="other">Other / General</option>
            </Select>

            <Input
              id="subject"
              label="Short Description"
              placeholder="e.g. Sink pipe leaking"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />

            <Textarea
              id="details"
              label="Full Details"
              placeholder="When did it start? How severe is it? Any other helpful info..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              required
            />

            {/* Emergency Hotline Notice */}
            <div className="flex items-start gap-3 rounded-xl border border-warning-border bg-warning-bg p-4 text-sm">
              <div className="shrink-0 rounded-xl bg-warning-bg p-2 text-warning-fg ring-1 ring-inset ring-warning-border">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-fg">
                  Emergency? Call the hotline
                </p>
                <p className="mt-1 text-xs text-fg-soft">
                  For gas leaks, fire, or flooding — call{" "}
                  <strong className="text-warning-fg">0917-222-3333</strong> (24/7) instead of submitting this form.
                </p>
              </div>
            </div>

            <Button type="submit" className="w-full">
              {submitted ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Submitted! Tracking ID: T-{tickets[0]?.id}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Submit Request
                </>
              )}
            </Button>
          </form>
        </Card>

        {/* My Request History */}
        <Card className="p-6 animate-fade-in-up stagger" style={{ "--i": 1 } as CSSProperties}>
          <SectionHeader
            icon={<ClipboardList className="h-5 w-5" />}
            title="My Request History"
            subtitle="Track the status of your past requests"
          />

          <div className="mt-5 space-y-3">
            {tickets.length === 0 ? (
              <EmptyState
                title="No requests yet"
                description="Your submitted repair requests will show up here."
              />
            ) : (
              tickets.map((t, i) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTicket(t)}
                  className="w-full rounded-xl border border-edge bg-inset p-4 text-left animate-fade-in-up stagger transition-all duration-200 hover:-translate-y-0.5 hover:border-edge-strong hover:shadow-pop"
                  style={{ "--i": i + 1 } as CSSProperties}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-accent">{t.id}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted">{t.date}</span>
                      <Badge
                        dot
                        variant={
                          t.priority === "urgent" ? "danger" : t.status === "resolved" ? "success" : "warning"
                        }
                      >
                        {t.status === "pending" ? "Pending" : t.status}
                      </Badge>
                    </div>
                  </div>
                  <p className="mt-2 text-sm font-bold capitalize text-fg">{t.type}</p>
                  <p className="mt-0.5 text-sm text-fg-soft">{t.description}</p>
                  <p className="mt-2 text-[11px] font-bold text-accent">View details →</p>
                </button>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <Modal
          open={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          title={`Request ${selectedTicket.id}`}
          footer={
            <Button type="button" onClick={() => setSelectedTicket(null)}>
              Close
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                {selectedTicket.type}
              </span>
              <Badge
                dot
                variant={
                  selectedTicket.priority === "urgent"
                    ? "danger"
                    : selectedTicket.status === "resolved"
                    ? "success"
                    : "warning"
                }
              >
                {selectedTicket.status === "pending" ? "Pending" : selectedTicket.status}
              </Badge>
            </div>
            <div className="space-y-1.5 rounded-xl border border-edge bg-inset p-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted">Priority</span>
                <span className="font-bold capitalize text-fg">{selectedTicket.priority}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Date Submitted</span>
                <span className="font-bold capitalize text-fg">{selectedTicket.date}</span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-fg-soft">{selectedTicket.description}</p>
            <p className="text-[11px] text-muted">
              {selectedTicket.status === "resolved"
                ? "This request has been completed. If the issue persists, please submit a new request."
                : "Our maintenance team will respond within 24 hours. Keep your phone accessible in case the technician needs to reach you."}
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}