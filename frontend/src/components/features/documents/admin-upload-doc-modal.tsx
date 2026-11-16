import { useId } from "react";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatFileSize } from "@/lib/formatters";
import type { DocumentItem } from "@/lib/types";
import {
  DOCUMENT_CATEGORIES,
  useUploadDocumentForm,
} from "./hooks/useUploadDocumentForm";

interface AdminUploadDocModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (newDoc: DocumentItem) => void;
}

export function AdminUploadDocModal({ open, onClose, onSuccess }: AdminUploadDocModalProps) {
  const {
    fileInputRef,
    file,
    setFile,
    name,
    setName,
    category,
    setCategory,
    description,
    setDescription,
    dragActive,
    uploading,
    error,
    handleFileChange,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleClose,
    handleSubmit,
  } = useUploadDocumentForm({ onSuccess, onClose });

  const nameInputId = useId();
  const categorySelectId = useId();
  const descriptionId = useId();

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Upload & Publish Document"
      maxWidth="md"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={uploading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!file || uploading}
            loading={uploading}
          >
            Publish to Tenants
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-md border border-danger-border bg-danger-bg px-3 py-2.5 text-xs text-danger-fg">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* File Dropzone */}
        {!file ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group relative flex flex-col items-center justify-center rounded-md border border-dashed p-6 text-center cursor-pointer transition-colors ${
              dragActive
                ? "border-accent bg-accent-soft/40"
                : "border-edge bg-inset/50 hover:border-accent hover:bg-hover/40"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.txt"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
            />
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent-soft text-accent">
              <UploadCloud className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-semibold text-fg">
              Click to select or drag and drop document
            </p>
            <p className="mt-1 text-xs text-muted">
              PDF, Word (DOC/DOCX), Excel, or images up to 25MB
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-md border border-edge bg-card p-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent">
                <FileText className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-fg">{file.name}</p>
                <p className="text-xs text-muted">{formatFileSize(file.size)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="rounded-lg p-1.5 text-muted hover:bg-hover hover:text-danger-fg transition-colors"
              title="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Document Title */}
        <Input
          id={nameInputId}
          label="Document Title"
          placeholder="e.g. AriRent Standard Lease Contract"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        {/* Category */}
        <Select
          id={categorySelectId}
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {DOCUMENT_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </Select>

        {/* Description / Instructions */}
        <Textarea
          id={descriptionId}
          label="Description / Instructions (Optional)"
          placeholder="Brief summary or guidelines for tenants reading this document..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        <div className="flex items-start gap-2 rounded-md border border-accent-border bg-accent-soft p-3 text-xs text-muted">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-accent mt-0.5" />
          <span>
            Once published, this document will be instantly accessible for all tenants to view and
            download in their portal.
          </span>
        </div>
      </form>
    </Modal>
  );
}
