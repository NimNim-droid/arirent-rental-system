import { useRef, useState } from "react";
import { Download, FileText, FolderOpen, UploadCloud } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { SectionHeader } from "@/components/common/section-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

interface DocumentItem {
  id: number;
  name: string;
  uploadedDate: string;
  type: string;
  size: string;
  url?: string;
}

export default function TenantDocuments() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploaded, setUploaded] = useState(false);
  const [unavailableDoc, setUnavailableDoc] = useState<DocumentItem | null>(null);
  const [docs, setDocs] = useState<DocumentItem[]>([
    {
      id: 1,
      name: "Lease Agreement.pdf",
      uploadedDate: "Sept 1, 2026",
      type: "Lease",
      size: "1.2 MB",
    },
    {
      id: 2,
      name: "Official Receipt — Deposit.pdf",
      uploadedDate: "Sept 1, 2026",
      type: "Receipt",
      size: "840 KB",
    },
  ]);

  const formatFileSize = (bytes: number) =>
    bytes >= 1024 * 1024
      ? `${(bytes / (1024 * 1024)).toFixed(2)} MB`
      : `${Math.max(1, Math.round(bytes / 1024))} KB`;

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const now = Date.now();
    const added: DocumentItem[] = Array.from(files).map((file, i) => ({
      id: now + i,
      name: file.name,
      uploadedDate: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      type: "Attachment",
      size: formatFileSize(file.size),
      url: URL.createObjectURL(file),
    }));
    setDocs((prev) => [...added, ...prev]);
    setUploaded(true);
    setTimeout(() => setUploaded(false), 3000);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDownload = (doc: DocumentItem) => {
    if (!doc.url) {
      setUnavailableDoc(doc);
      return;
    }
    const link = document.createElement("a");
    link.href = doc.url;
    link.download = doc.name;
    link.click();
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Documents & Files"
        subtitle="View your lease agreement and official receipts, or attach supporting documents"
      />

      {/* Upload Area */}
      <Card
        className="cursor-pointer border-2 border-dashed border-edge-strong p-8 text-center transition-all duration-200 hover:border-accent hover:bg-accent-soft/40"
        onClick={() => fileInputRef.current?.click()}
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
        <h3 className="mt-3 font-bold text-fg">Upload a Document</h3>
        <p className="mt-1 text-xs text-muted">
          Click or drag a scanned receipt, permit, or written request below
        </p>
        {uploaded && (
          <span className="mt-3 block animate-fade-in text-xs font-bold text-success-fg">
            File submitted successfully!
          </span>
        )}
      </Card>

      {/* Document Files */}
      <div className="space-y-4">
        <SectionHeader
          icon={<FolderOpen className="h-5 w-5" />}
          title={`My Documents (${docs.length})`}
          subtitle="Important contracts and receipts for your unit"
        />

        {docs.length === 0 ? (
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
                      <Badge variant={doc.url ? "success" : "info"}>{doc.type}</Badge>
                      <span className="text-[11px] text-muted">
                        {doc.size} • {doc.uploadedDate}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-accent hover:text-accent-strong"
                  onClick={() => handleDownload(doc)}
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Download</span>
                </Button>
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
    </div>
  );
}