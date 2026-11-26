import { type FormEvent } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Inquiry, InquiryStatus } from "@/lib/types";

interface ManageInquiryModalProps {
  inquiry: Inquiry | null;
  status: InquiryStatus;
  onStatusChange: (status: InquiryStatus) => void;
  scheduledAt: string;
  onScheduledAtChange: (value: string) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  saving: boolean;
  onSubmit: (e: FormEvent) => void;
  onClose: () => void;
}

export function ManageInquiryModal({
  inquiry,
  status,
  onStatusChange,
  scheduledAt,
  onScheduledAtChange,
  notes,
  onNotesChange,
  saving,
  onSubmit,
  onClose,
}: ManageInquiryModalProps) {
  if (!inquiry) return null;

  return (
    <Modal
      open={Boolean(inquiry)}
      onClose={onClose}
      title={`Update Inquiry — ${inquiry.name}`}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="manage-inquiry-form" loading={saving}>
            Save Update
          </Button>
        </>
      }
    >
      <form id="manage-inquiry-form" onSubmit={onSubmit} className="space-y-4">
        <Select
          id="inqStatus"
          label="Inquiry Status"
          value={status}
          onChange={(e) => onStatusChange(e.target.value as InquiryStatus)}
        >
          <option value="new">New Request</option>
          <option value="scheduled">Visit Scheduled</option>
          <option value="visited">Visited Property</option>
          <option value="converted">Applied as Tenant</option>
          <option value="cancelled">Cancelled / Not Proceeding</option>
        </Select>

        <Input
          id="inqScheduledAt"
          label="Confirmed Visit Date & Time"
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => onScheduledAtChange(e.target.value)}
        />

        <Textarea
          id="inqAdminNotes"
          label="Private Landlord Notes"
          rows={3}
          placeholder="e.g. Confirmed Saturday 2PM via SMS, bringing 1 roommate..."
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
        />
      </form>
    </Modal>
  );
}
