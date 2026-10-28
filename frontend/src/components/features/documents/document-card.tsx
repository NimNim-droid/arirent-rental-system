import { Download, FileText, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatFileSize, formatDate } from "@/lib/formatters";
import type { DocumentItem } from "@/lib/types";

interface DocumentCardProps {
  doc: DocumentItem;
  onDownload: (doc: DocumentItem) => void;
  onDelete?: (doc: DocumentItem) => void;
  canDelete?: boolean;
}

/** Flat, readable category chips — status semantics, not decoration. */
const CATEGORY_VARIANTS: Record<string, "info" | "warning" | "success" | "neutral"> = {
  "Contracts & Agreements": "info",
  "House Rules & Regulations": "warning",
  "Checklists & Guides": "success",
};

export function DocumentCard({ doc, onDownload, onDelete, canDelete = true }: DocumentCardProps) {
  const extension = doc.type ? doc.type.split("/").pop()?.toUpperCase() : "PDF";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-hover/40 transition-colors">
      <div className="flex items-start gap-3 min-w-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-edge bg-inset text-faint mt-0.5">
          <FileText className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="truncate text-[13px] font-medium text-fg">{doc.name}</h4>
            {doc.category && (
              <Badge variant={CATEGORY_VARIANTS[doc.category] ?? "neutral"}>
                {doc.category}
              </Badge>
            )}
          </div>
          {doc.description && (
            <p className="text-xs text-muted mt-0.5 line-clamp-2">{doc.description}</p>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted">
            <span className="font-medium text-fg-soft">{extension || "PDF"}</span>
            <span aria-hidden="true">&middot;</span>
            <span className="tabular-nums">{formatFileSize(doc.size)}</span>
            <span aria-hidden="true">&middot;</span>
            <span>Published {formatDate(doc.uploaded_at)}</span>
            {doc.uploaded_by && (
              <>
                <span aria-hidden="true">&middot;</span>
                <span className="truncate max-w-[160px]">{doc.uploaded_by}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-1 sm:pt-0">
        <Button variant="secondary" size="sm" onClick={() => onDownload(doc)}>
          <Download className="h-3.5 w-3.5" />
          Download
        </Button>
        {canDelete && onDelete && (
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Delete ${doc.name}`}
            className="text-muted hover:text-danger-fg hover:bg-danger-bg/40 px-2"
            onClick={() => onDelete(doc)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
