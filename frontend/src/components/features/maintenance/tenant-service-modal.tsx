import { useState, useEffect } from "react";
import { Wrench, Sparkles, Send, Phone, AlertCircle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { maintenanceService } from "@/lib/services/maintenance";
import { getErrorMessage } from "@/lib/errors";
import type { MaintenanceTicket } from "@/lib/types";

interface TenantServiceModalProps {
  open: boolean;
  onClose: () => void;
  serviceCategory: "repairs" | "housekeeping";
  onSuccess: () => void | Promise<void>;
}

const REPAIR_TYPES: { value: MaintenanceTicket["type"]; label: string }[] = [
  { value: "plumbing", label: "Plumbing (pipe, sink, toilet leak)" },
  { value: "electrical", label: "Electrical (lights, outlet, power, switch)" },
  { value: "appliances", label: "Appliances (AC, refrigerator, heater)" },
  { value: "general", label: "Other Structural / Fixture Repair" },
];

export function TenantServiceModal({
  open,
  onClose,
  serviceCategory,
  onSuccess,
}: TenantServiceModalProps) {
  const isRepairs = serviceCategory === "repairs";

  const [issueType, setIssueType] = useState<MaintenanceTicket["type"]>(
    isRepairs ? "plumbing" : "general"
  );
  const [priority, setPriority] = useState<MaintenanceTicket["priority"]>("normal");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setIssueType(isRepairs ? "plumbing" : "general");
      setPriority("normal");
      setDescription("");
      setError("");
    }
  }, [open, isRepairs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      await maintenanceService.createTicket({
        type: isRepairs ? issueType : "general",
        priority,
        description: description.trim(),
      });
      await onSuccess();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to submit service request."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isRepairs ? "Request a Repair" : "Request Housekeeping"}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-danger-border bg-danger-bg p-3 text-xs font-semibold text-danger-fg">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center gap-2.5 rounded-xl border border-edge bg-inset p-3 text-xs text-muted">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
            {isRepairs ? <Wrench className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          </div>
          <p className="leading-relaxed">
            {isRepairs
              ? "Submit maintenance issues with plumbing, electricity, or air conditioning."
              : "Request hallway cleaning, trash coordination, or general room assistance."}
          </p>
        </div>

        {isRepairs && (
          <Select
            id="modal-issue-type"
            label="Specific Repair Category"
            value={issueType}
            onChange={(e) =>
              setIssueType(e.target.value as MaintenanceTicket["type"])
            }
          >
            {REPAIR_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        )}

        <Select
          id="modal-priority"
          label="Priority Level"
          value={priority}
          onChange={(e) =>
            setPriority(e.target.value as MaintenanceTicket["priority"])
          }
        >
          <option value="normal">Normal (Routine dispatch within 24-48 hrs)</option>
          <option value="urgent">Urgent (Immediate attention required)</option>
        </Select>

        <Textarea
          id="modal-description"
          label="Details & Description"
          placeholder={
            isRepairs
              ? "e.g. Water leaking under the sink, or air conditioner not cooling..."
              : "e.g. Requesting hallway sweep or trash bin replacement..."
          }
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        {/* Emergency notice */}
        <div className="flex items-start gap-2.5 rounded-xl border border-warning-border bg-warning-bg/60 p-3 text-xs text-warning-fg">
          <Phone className="h-4 w-4 shrink-0 mt-0.5" />
          <p className="leading-snug">
            For critical emergencies (gas leak, flooding, electrical fire), call the 24/7 hotline directly:{" "}
            <a href="tel:09172223333" className="font-bold underline">
              0917-222-3333
            </a>.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-edge">
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting} disabled={!description.trim()}>
            <Send className="h-4 w-4" /> Submit Request
          </Button>
        </div>
      </form>
    </Modal>
  );
}
