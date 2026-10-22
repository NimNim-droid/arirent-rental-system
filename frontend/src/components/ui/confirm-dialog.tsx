import { type ReactNode } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Modal } from "./modal";
import { Button } from "./button";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning";
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  loading = false,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      maxWidth="sm"
      footer={
        <div className="flex w-full items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variant === "danger" ? "danger" : "primary"}
            size="sm"
            loading={loading}
            onClick={onConfirm}
          >
            {variant === "danger" && !loading && <Trash2 className="h-3.5 w-3.5" />}
            {confirmText}
          </Button>
        </div>
      }
    >
      <div className="flex items-start gap-3.5 py-1 text-sm">
        <div
          className={`rounded-xl p-2.5 shrink-0 ${
            variant === "danger"
              ? "bg-danger/15 text-danger-fg border border-danger/25"
              : "bg-warning/15 text-warning-fg border border-warning/25"
          }`}
        >
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="space-y-1.5 flex-1 min-w-0">
          <p className="text-xs text-muted leading-relaxed">{description}</p>
        </div>
      </div>
    </Modal>
  );
}
