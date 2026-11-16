import { Phone } from "lucide-react";
import { Modal } from "@/components/ui/modal";

interface EmergencyHotlineModalProps {
  open: boolean;
  onClose: () => void;
  phone?: string | null;
}

/**
 * Emergency hotline bottom sheet matching AriRent redesign (Picture 2).
 * Simple, direct, and thumb-friendly.
 */
export function EmergencyHotlineModal({
  open,
  onClose,
  phone = "0917-222-3333",
}: EmergencyHotlineModalProps) {
  const hotline = phone || "0917-222-3333";
  const cleanTel = hotline.replace(/[^\d+]/g, "");

  return (
    <Modal
      open={open}
      onClose={onClose}
      hideHeader
      maxWidth="sm"
    >
      <div className="space-y-3 pt-1 pb-1">
        <div className="space-y-0.5">
          <h2 className="text-lg font-bold tracking-tight text-fg">
            Emergency hotline
          </h2>
          <p className="text-xs text-muted">
            Available 24/7 for urgent building issues.
          </p>
        </div>

        <div className="pt-2">
          <a
            href={`tel:${cleanTel}`}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#14233F] dark:bg-[#1D3560] py-3.5 px-4 text-sm font-bold text-white shadow-soft transition-all hover:opacity-95 active:scale-95 text-center"
          >
            <Phone className="h-4 w-4" />
            <span>Call {hotline}</span>
          </a>
        </div>
      </div>
    </Modal>
  );
}
