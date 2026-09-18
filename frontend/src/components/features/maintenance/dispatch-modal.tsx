import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { MaintenanceTicket } from "@/lib/types";

interface DispatchModalProps {
  open: boolean;
  ticket: MaintenanceTicket | null;
  techName: string;
  adminNotes: string;
  isBusy: boolean;
  onTechNameChange: (name: string) => void;
  onAdminNotesChange: (notes: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function DispatchModal({
  open,
  ticket,
  techName,
  adminNotes,
  isBusy,
  onTechNameChange,
  onAdminNotesChange,
  onSubmit,
  onClose,
}: DispatchModalProps) {
  if (!open || !ticket) return null;

  const formattedId = /^\d+$/.test(ticket.id) ? `#${ticket.id}` : ticket.id;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Dispatch Technician — ${formattedId}`}
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isBusy}
          >
            Cancel
          </Button>
          <Button type="submit" form="dispatch-form" loading={isBusy}>
            Save & Assign
          </Button>
        </>
      }
    >
      <form id="dispatch-form" onSubmit={onSubmit} className="space-y-4">
        <div className="rounded-xl border border-edge bg-inset p-3 text-xs space-y-1">
          <p className="font-bold text-fg">
            Room {ticket.room} &bull; {ticket.tenant_name}
          </p>
          <p className="text-muted">{ticket.description}</p>
        </div>

        <Input
          id="techName"
          label="Technician Name / Service Provider"
          placeholder="e.g. Juan dela Cruz (Aircon Specialist)"
          value={techName}
          onChange={(e) => onTechNameChange(e.target.value)}
          required
        />

        <Textarea
          id="notes"
          label="Internal Notes / Scope of Work (Optional)"
          placeholder="e.g. Parts needed: 1/2-inch PVC valve. Resident is home after 2 PM."
          value={adminNotes}
          onChange={(e) => onAdminNotesChange(e.target.value)}
          rows={3}
        />
      </form>
    </Modal>
  );
}
