import { type RefObject } from "react";
import { UploadCloud } from "lucide-react";
import { Card } from "@/components/ui/card";

interface DocumentUploadZoneProps {
  uploading: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFilesSelected: (files: FileList | null) => void;
}

export function DocumentUploadZone({
  uploading,
  fileInputRef,
  onFilesSelected,
}: DocumentUploadZoneProps) {
  return (
    <Card
      className="cursor-pointer border-2 border-dashed border-edge-strong p-6 text-center transition-colors hover:border-accent hover:bg-hover/20"
      onClick={() => !uploading && fileInputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onFilesSelected(e.dataTransfer.files);
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
        className="hidden"
        onChange={(e) => onFilesSelected(e.target.files)}
      />
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-inset text-muted border border-edge">
        <UploadCloud className="h-5 w-5" />
      </div>
      <h3 className="mt-2.5 text-sm font-bold text-fg">
        {uploading ? "Uploading files…" : "Upload a Document or Receipt"}
      </h3>
      <p className="mt-0.5 text-xs text-muted">
        Click or drop PDF contracts, government IDs, or payment receipts (Max 10MB)
      </p>
    </Card>
  );
}
