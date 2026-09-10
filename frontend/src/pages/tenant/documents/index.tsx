import { useCallback, useEffect, useRef, useState } from "react";
import {
  Download,
  FileText,
  FolderOpen,
  UploadCloud,
  RefreshCw,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { SectionHeader } from "@/components/common/section-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { SkeletonCards } from "@/components/ui/skeleton";
import { documentsService } from "@/lib/services/documents";
import { getErrorMessage } from "@/lib/errors";
import type { DocumentItem } from "@/lib/types";

function formatFileSize(value?: number | string): string {
  if (typeof value === "string") return value;
  if (typeof value !== "number") return "—";
  return value >= 1024 * 1024
    ? `${(value / (1024 * 1024)).toFixed(2)} MB`
    : `${Math.max(1, Math.round(value / 1024))} KB`;
}

function formatDate(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function TenantDocuments() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [unavailableDoc, setUnavailableDoc] = useState<DocumentItem | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<DocumentItem | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const loadDocs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await documentsService.getDocuments();
      setDocs(res);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load your documents."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");
    setSuccessMsg("");
    try {
      const uploaded: DocumentItem[] = [];
      for (const file of Array.from(files)) {
        uploaded.push(await documentsService.uploadDocument(file));
      }
      setDocs((prev) => [...uploaded.reverse(), ...prev]);
      setSuccessMsg(
        uploaded.length > 1
          ? `${uploaded.length} files uploaded successfully!`
          : "File uploaded successfully!"
      );
    } catch (err) {
      setError(getErrorMessage(err, "Unable to upload the file(s)."));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownload = (doc: DocumentItem) => {
    if (!doc.url) {
      setUnavailableDoc(doc);
      return;
    }
    const link = document.createElement("a");
    link.href = doc.url;
    link.target = "_blank";
    link.click();
  };

  const handleDelete = async (doc: DocumentItem) => {
    setDeleteBusy(true);
    setError("");
    try {
      await documentsService.deleteDocument(doc.id);
      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
      setDeletingDoc(null);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to delete the document."));
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Documents & Files"
        subtitle="View your lease agreement and official receipts, or attach supporting documents"
      />

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-xs font-semibold text-danger-fg">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </span>
          <Button variant="ghost" size="sm" onClick={loadDocs}>
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      )}

      {successMsg && (
        <div className="flex animate-fade-in-up items-center gap-2 rounded-xl border border-success-border bg-success-bg px-4 py-3 text-xs font-semibold text-success-fg">
          <FileText className="h-4 w-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Upload Area */}
      <Card
        className="cursor-pointer border-2 border-dashed border-edge-strong p-8 text-center transition-all duration-200 hover:border-accent hover:bg-accent-soft/40"
        onClick={() => !uploading && fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleFiles(e.dataTransfer.files);
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-inset text-muted ring-1 ring-inset ring-edge">
          <UploadCloud className="h-7 w-7" />
        </div>
        <h3 className="mt-3 font-bold text-fg">
          {uploading ? "Uploading…" : "Upload a Document"}
        </h3>
        <p className="mt-1 text-xs text-muted">
          Click or drag a scanned receipt, permit, or written request below
        </p>
      </Card>

      {/* Document Files */}
      <div className="space-y-4">
        <SectionHeader
          icon={<FolderOpen className="h-5 w-5" />}
          title={`My Documents (${docs.length})`}
          subtitle="Important contracts and receipts for your unit"
        />

        {loading ? (
          <SkeletonCards cards={2} />
        ) : docs.length === 0 ? (
          <Card className="p-8 text-center text-xs text-muted">
            No documents yet. Upload your first file above.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {docs.map((doc) => (
              <Card key={doc.id} className="flex items-start justify-between gap-4 p-5">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="shrink-0 rounded-2xl bg-accent-soft p-3 text-accent ring-1 ring-inset ring-accent-border">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-fg">{doc.name}</h3>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <Badge variant={doc.url ? "success" : "info"}>{doc.type ?? "File"}</Badge>
                      <span className="text-[11px] text-muted">
                        {formatFileSize(doc.size)} • {formatDate(doc.uploaded_at)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-accent hover:text-accent-strong"
                    onClick={() => handleDownload(doc)}
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Download</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Delete ${doc.name}`}
                    className="text-danger-fg hover:bg-danger-bg hover:text-danger-fg"
                    onClick={() => setDeletingDoc(doc)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Unavailable Document Notice */}
      <Modal
        open={!!unavailableDoc}
        onClose={() => setUnavailableDoc(null)}
        title={unavailableDoc?.name ?? "Document unavailable"}
        footer={
          <Button type="button" onClick={() => setUnavailableDoc(null)}>
            OK
          </Button>
        }
      >
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-fg">This file isn't available for download yet.</p>
          <p className="text-xs text-muted">
            The original copy of {unavailableDoc?.name} is kept in the office's records. If you
            need a copy, please contact the property manager.
          </p>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deletingDoc}
        onClose={() => setDeletingDoc(null)}
        title="Delete document?"
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setDeletingDoc(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={deleteBusy}
              onClick={() => deletingDoc && handleDelete(deletingDoc)}
            >
              {!deleteBusy && "Delete"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          This will permanently remove <strong className="text-fg">{deletingDoc?.name}</strong>.
          This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}