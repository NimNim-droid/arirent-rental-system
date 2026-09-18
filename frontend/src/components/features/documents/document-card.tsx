import { Download, FileText, Trash2, FileCheck, ShieldCheck, ClipboardCheck, Info } from "lucide-react";
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

export function DocumentCard({ doc, onDownload, onDelete, canDelete = true }: DocumentCardProps) {
  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case "Contracts & Agreements":
        return <FileCheck className="h-4.5 w-4.5 text-blue-500" />;
      case "House Rules & Regulations":
        return <ShieldCheck className="h-4.5 w-4.5 text-amber-500" />;
      case "Checklists & Guides":
        return <ClipboardCheck className="h-4.5 w-4.5 text-emerald-500" />;
      default:
        return <FileText className="h-4.5 w-4.5 text-accent" />;
    }
  };

  const getCategoryBadgeVariant = (category?: string) => {
    switch (category) {
      case "Contracts & Agreements":
        return "info" as const;
      case "House Rules & Regulations":
        return "warning" as const;
      case "Checklists & Guides":
        return "success" as const;
      default:
        return "neutral" as const;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-hover/30 transition-colors">
      <div className="flex items-start gap-3 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft border border-accent-border mt-0.5">
          {getCategoryIcon(doc.category)}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="truncate text-sm font-semibold text-fg">{doc.name}</h4>
            {doc.category && (
              <Badge variant={getCategoryBadgeVariant(doc.category)} className="text-[10px] py-0">
                {doc.category}
              </Badge>
            )}
          </div>
          {doc.description && (
            <p className="text-xs text-muted mt-1 line-clamp-2">{doc.description}</p>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
            <Badge
              variant={doc.url && doc.url !== "#" ? "neutral" : "warning"}
              className="text-[10px] py-0 font-mono"
            >
              {doc.type ? doc.type.split("/").pop()?.toUpperCase() : "PDF"}
            </Badge>
            <span>{formatFileSize(doc.size)}</span>
            <span>&bull;</span>
            <span>Published {formatDate(doc.uploaded_at)}</span>
            {doc.uploaded_by && (
              <>
                <span>&bull;</span>
                <span className="truncate max-w-[140px]">By {doc.uploaded_by}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-1 sm:pt-0">
        <Button
          variant="secondary"
          size="sm"
          className="text-xs font-medium"
          onClick={() => onDownload(doc)}
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </Button>
        {canDelete && onDelete && (
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Delete ${doc.name}`}
            className="text-muted hover:text-danger-fg hover:bg-danger-bg/40 text-xs px-2"
            onClick={() => onDelete(doc)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
