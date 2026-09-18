import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import type { DocumentItem } from "@/lib/types";

interface UnavailableDocModalProps {
  doc: DocumentItem | null;
  onClose: () => void;
}

export function UnavailableDocModal({ doc, onClose }: UnavailableDocModalProps) {
  if (!doc) return null;

  return (
    <Modal
      open={!!doc}
      onClose={onClose}
      title={doc.name}
      footer={
        <Button type="button" onClick={onClose}>
          OK
        </Button>
      }
    >
      <div className="space-y-2 text-sm">
        <p className="font-semibold text-fg">
          This file isn't available for download yet.
        </p>
        <p className="text-xs text-muted">
          The original copy of {doc.name} is kept in the office's records. If
          you need a copy, please contact the property manager.
        </p>
      </div>
    </Modal>
  );
}
