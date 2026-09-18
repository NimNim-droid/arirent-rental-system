import { Wrench, Phone, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/common/section-header";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ISSUE_TYPES } from "./hooks/useTenantMaintenance";
import type { MaintenanceTicket } from "@/lib/types";

interface TicketFormProps {
  issueType: MaintenanceTicket["type"];
  priority: MaintenanceTicket["priority"];
  description: string;
  submitting: boolean;
  onIssueTypeChange: (type: MaintenanceTicket["type"]) => void;
  onPriorityChange: (priority: MaintenanceTicket["priority"]) => void;
  onDescriptionChange: (desc: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function TicketForm({
  issueType,
  priority,
  description,
  submitting,
  onIssueTypeChange,
  onPriorityChange,
  onDescriptionChange,
  onSubmit,
}: TicketFormProps) {
  return (
    <Card className="p-6">
      <SectionHeader
        icon={<Wrench className="h-5 w-5" />}
        title="Submit a Repair Request"
        subtitle="Describe the issue and our technician will be dispatched"
      />

      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <Select
          id="type"
          label="Issue Type"
          value={issueType}
          onChange={(e) =>
            onIssueTypeChange(e.target.value as MaintenanceTicket["type"])
          }
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
              onPriorityChange(e.target.value as MaintenanceTicket["priority"])
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
          onChange={(e) => onDescriptionChange(e.target.value)}
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
              <strong className="text-warning-fg">0917-222-3333</strong> (24/7)
              instead of submitting this form.
            </p>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          loading={submitting}
          disabled={!description.trim()}
        >
          {!submitting && (
            <>
              <Send className="h-4 w-4" /> Submit Request
            </>
          )}
        </Button>
      </form>
    </Card>
  );
}
