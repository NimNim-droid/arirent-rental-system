import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import {
  Phone,
  Send,
  ClipboardList,
  Wrench,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
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
import { SkeletonRows } from "@/components/ui/skeleton";
import { maintenanceService } from "@/lib/services/maintenance";
import { getErrorMessage } from "@/lib/errors";
import type { MaintenanceTicket } from "@/lib/types";

const ISSUE_TYPES: { value: MaintenanceTicket["type"]; label: string }[] = [
  { value: "plumbing", label: "Plumbing (sink, toilet, pipe)" },
  { value: "electrical", label: "Electrical (lights, outlets, switch)" },
  { value: "appliances", label: "Appliances (AC, fridge, water heater)" },
  { value: "general", label: "Other / General" },
];

function ticketId(t: MaintenanceTicket) {
  return /^\d+$/.test(t.id) ? `#${t.id}` : t.id;
}

export default function TenantMaintenance() {
  const [description, setDescription] = useState("");
  const [issueType, setIssueType] = useState<MaintenanceTicket["type"]>("plumbing");
  const [priority, setPriority] = useState<MaintenanceTicket["priority"]>("normal");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicket | null>(null);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await maintenanceService.getTickets({ per_page: 100 });
      setTickets(res.data);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load your requests."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      await maintenanceService.createTicket({
        type: issueType,
        description,
        priority,
      });
      setDescription("");
      setPriority("normal");
      setNotice("Request submitted! Our maintenance team will respond within 24 hours.");
      await loadTickets();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to submit your request."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Maintenance Requests"
        subtitle="Submit repair requests anytime — our team responds within 24 hours"
      />

      {notice && (
        <div className="flex items-center gap-2 rounded-xl border border-success-border bg-success-bg px-4 py-3 text-xs font-semibold text-success-fg">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {notice}
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-xs font-semibold text-danger-fg">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </span>
          <Button variant="ghost" size="sm" onClick={loadTickets}>
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      )}

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
              onChange={(e) => setIssueType(e.target.value as MaintenanceTicket["type"])}
            >
              {ISSUE_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                id="priority"
                label="Priority"
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as MaintenanceTicket["priority"])
                }
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
              </Select>
            </div>

            <Textarea
              id="description"
              label="Full Details"
              placeholder="When did it start? How severe is it? Any other helpful info..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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

            <Button type="submit" className="w-full" loading={submitting} disabled={!description.trim()}>
              {!submitting && (
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
            {loading ? (
              <SkeletonRows rows={4} />
            ) : tickets.length === 0 ? (
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
                    <span className="font-mono text-xs font-bold text-accent">{ticketId(t)}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted">{t.date}</span>
                      <Badge
                        dot
                        variant={
                          t.priority === "urgent" ? "danger" : t.status === "resolved" ? "success" : "warning"
                        }
                      >
                        {t.status === "pending" ? "Pending" : t.status.replace("_", " ")}
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
          title={`Request ${ticketId(selectedTicket)}`}
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
                {selectedTicket.status === "pending" ? "Pending" : selectedTicket.status.replace("_", " ")}
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
              {selectedTicket.technician_name && (
                <div className="flex items-center justify-between">
                  <span className="text-muted">Technician</span>
                  <span className="font-bold capitalize text-fg">
                    {selectedTicket.technician_name}
                  </span>
                </div>
              )}
              {selectedTicket.admin_notes && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted">Admin Notes</span>
                  <span className="font-bold text-right text-fg">
                    {selectedTicket.admin_notes}
                  </span>
                </div>
              )}
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