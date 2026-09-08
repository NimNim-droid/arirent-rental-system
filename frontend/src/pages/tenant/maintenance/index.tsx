import { useState } from "react";
import { Wrench, PhoneCall, Plus, CheckCircle2, Clock } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function TenantMaintenance() {
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
      description: "Main room light bulb replacement.",
      priority: "normal",
      status: "resolved",
      date: "2026-08-20",
    },
  ]);

  const [form, setForm] = useState({
    type: "plumbing",
    description: "",
    priority: "normal",
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTicket = {
      id: `T-${Math.floor(100 + Math.random() * 900)}`,
      type: form.type,
      description: form.description,
      priority: form.priority,
      status: "pending",
      date: new Date().toISOString().split("T")[0],
    };
    setTickets([newTicket, ...tickets]);
    setForm({ type: "plumbing", description: "", priority: "normal" });
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Maintenance & Repairs"
        subtitle="Submit repair requests for your unit and monitor technician status"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ticket Submission Form */}
        <Card className="lg:col-span-1 p-6 space-y-5 h-fit">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Wrench className="h-5 w-5 text-sky-600" />
            <h2 className="text-base font-bold text-slate-900">Request a Repair</h2>
          </div>

          {submitted && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Ticket submitted to building maintenance!
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              id="type"
              label="Issue Category"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="plumbing">Plumbing & Water</option>
              <option value="electrical">Electrical & Lighting</option>
              <option value="appliances">Aircon & Appliances</option>
              <option value="general">Carpentry & General</option>
            </Select>

            <Select
              id="priority"
              label="Urgency Level"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              <option value="normal">Normal (within 48 hours)</option>
              <option value="urgent">Urgent (Immediate attention)</option>
            </Select>

            <Textarea
              id="description"
              label="Describe the Problem"
              placeholder="What seems to be the issue? e.g. Water dripping under the sink..."
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />

            <Button type="submit" className="w-full">
              <Plus className="h-4 w-4" /> Submit Repair Ticket
            </Button>
          </form>

          {/* Emergency Hotline Box */}
          <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-800">
              <PhoneCall className="h-4 w-4" /> Emergency Building Hotline
            </div>
            <p className="text-amber-700">For water floods or electrical fires, call immediately:</p>
            <p className="font-mono font-black text-amber-900 text-sm pt-1">0917-999-HELP (4357)</p>
          </div>
        </Card>

        {/* My Tickets List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-slate-900">My Requests ({tickets.length})</h2>

          <div className="space-y-3">
            {tickets.map((t) => (
              <Card key={t.id} className="p-5 flex flex-col justify-between space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-sky-600">{t.id}</span>
                    <h3 className="font-bold text-slate-800 text-base capitalize mt-0.5">
                      {t.type} Issue
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Submitted on {t.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={t.priority === "urgent" ? "danger" : "neutral"}>
                      {t.priority}
                    </Badge>
                    <Badge
                      variant={
                        t.status === "resolved"
                          ? "success"
                          : t.status === "in_progress"
                          ? "warning"
                          : "info"
                      }
                    >
                      {t.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>

                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {t.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
