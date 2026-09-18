import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import type { DocumentItem } from "@/lib/types";

interface DeleteDocModalProps {
  doc: DocumentItem | null;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteDocModal({
  doc,
  loading = false,
  onClose,
  onConfirm,
}: DeleteDocModalProps) {
  if (!doc) return null;

  return (
    <Modal
      open={!!doc}
      onClose={onClose}
      title="Delete document?"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            loading={loading}
            onClick={onConfirm}
          >
            {!loading && "Delete"}
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted">
        This will permanently remove <strong className="text-fg">{doc.name}</strong>.
        This action cannot be undone.
      </p>
    </Modal>
  );
}
