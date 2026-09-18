import { AlertTriangle, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

interface DeleteConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  warningNote?: string;
  confirmText?: string;
  actionLoading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeleteConfirmModal({
  open,
  title,
  description,
  warningNote,
  confirmText = "Delete",
  actionLoading,
  onConfirm,
  onClose,
}: DeleteConfirmModalProps) {
  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            className="bg-danger-fg hover:bg-danger-fg/90 text-white border-transparent"
            loading={actionLoading}
            onClick={onConfirm}
          >
            {!actionLoading && <Trash2 className="h-4 w-4 mr-1.5" />}
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="space-y-3 py-2">
        <p className="text-sm text-fg-soft">{description}</p>
        {warningNote && (
          <div className="flex items-start gap-2.5 rounded-xl border border-warning-border bg-warning-bg/40 p-3 text-xs text-warning-fg font-medium">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{warningNote}</span>
          </div>
        )}
      </div>
    </Modal>
  );
}
