import { Modal } from "@/components/ui/modal";

interface MeterPhotoViewerProps {
  /** Signed image URL, or null to keep the viewer closed. */
  url: string | null;
  title?: string;
  caption?: string;
  onClose: () => void;
}

/**
 * Read-only meter photo viewer.
 * Shared by the tenant home and the tenant bill details. It only displays the
 * photo recorded by the landlord; there is intentionally no upload, replace or
 * delete control here.
 */
export function MeterPhotoViewer({
  url,
  title = "Meter photo proof",
  caption,
  onClose,
}: MeterPhotoViewerProps) {
  return (
    <Modal open={Boolean(url)} onClose={onClose} title={title} maxWidth="md">
      {url && (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-2xl border border-edge bg-inset/40">
            <img
              src={url}
              alt="Electric meter reading proof"
              className="max-h-[65vh] w-full object-contain"
            />
          </div>
          {caption && <p className="text-center text-xs text-muted">{caption}</p>}
          <p className="text-center text-[11px] text-faint">
            Photo recorded by the property administrator.
          </p>
        </div>
      )}
    </Modal>
  );
}

