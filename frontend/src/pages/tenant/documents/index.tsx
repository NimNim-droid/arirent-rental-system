import { useState } from "react";
import { Download, FileText, FolderOpen, UploadCloud } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { SectionHeader } from "@/components/common/section-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function TenantDocuments() {
  const [uploaded, setUploaded] = useState(false);

  const documents = [
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
  ];

  const handleUpload = () => {
    setUploaded(true);
    setTimeout(() => setUploaded(false), 3000);
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
        onClick={handleUpload}
      >
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
          title={`My Documents (${documents.length})`}
          subtitle="Important contracts and receipts for your unit"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc) => (
            <Card key={doc.id} className="flex items-start justify-between gap-4 p-5">
              <div className="flex min-w-0 items-start gap-4">
                <div className="shrink-0 rounded-2xl bg-accent-soft p-3 text-accent ring-1 ring-inset ring-accent-border">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-bold text-fg">{doc.name}</h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <Badge variant="info">{doc.type}</Badge>
                    <span className="text-[11px] text-muted">
                      {doc.size} • {doc.uploadedDate}
                    </span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="shrink-0 text-accent hover:text-accent-strong">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Download</span>
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}