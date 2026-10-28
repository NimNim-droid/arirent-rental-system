import { useState, useMemo, useEffect, useCallback } from "react";
import {
  FileText,
  Upload,
  FolderOpen,
  RefreshCw,
  AlertTriangle,
  FileCheck,
  ShieldCheck,
  ClipboardList,
  HardDrive,
  Plus,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { SectionHeader } from "@/components/common/section-header";
import { SearchInput } from "@/components/common/search-input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SkeletonCards } from "@/components/ui/skeleton";
import { formatFileSize } from "@/lib/formatters";
import { documentsService } from "@/lib/services/documents";
import { getErrorMessage } from "@/lib/errors";
import type { DocumentItem } from "@/lib/types";
import {
  DocumentCard,
  AdminUploadDocModal,
  UnavailableDocModal,
  DeleteDocModal,
  DEFAULT_DOCUMENTS,
} from "@/components/features/documents";

const CATEGORIES = [
  "All",
  "Contracts & Agreements",
  "House Rules & Regulations",
  "Checklists & Guides",
  "Notices & Policies",
];

export default function AdminDocuments() {
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [unavailableDoc, setUnavailableDoc] = useState<DocumentItem | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<DocumentItem | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const loadDocs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await documentsService.getDocuments();
      if (res && res.length > 0) {
        setDocs(res);
      } else {
        setDocs(DEFAULT_DOCUMENTS);
      }
    } catch {
      setDocs(DEFAULT_DOCUMENTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  const handleDownload = (doc: DocumentItem) => {
    if (!doc.url || doc.url === "#") {
      setUnavailableDoc(doc);
      return;
    }
    const link = document.createElement("a");
    link.href = doc.url;
    link.target = "_blank";
    link.download = doc.name;
    link.click();
  };

  const handleDelete = async (doc: DocumentItem) => {
    setDeleteBusy(true);
    setError("");
    try {
      await documentsService.deleteDocument(doc.id);
      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
      setDeletingDoc(null);
      setSuccessMsg(`"${doc.name}" deleted successfully.`);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to delete the document."));
    } finally {
      setDeleteBusy(false);
    }
  };

  const handleUploadSuccess = (newDoc: DocumentItem) => {
    setDocs((prev) => [newDoc, ...prev]);
    setSuccessMsg(`"${newDoc.name}" published successfully for tenants!`);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return docs.filter((doc) => {
      const matchesSearch =
        search === "" ||
        doc.name.toLowerCase().includes(search.toLowerCase()) ||
        (doc.category && doc.category.toLowerCase().includes(search.toLowerCase())) ||
        (doc.description && doc.description.toLowerCase().includes(search.toLowerCase()));

      const matchesCategory =
        selectedCategory === "All" ||
        (doc.category && doc.category.toLowerCase() === selectedCategory.toLowerCase());

      return matchesSearch && matchesCategory;
    });
  }, [docs, search, selectedCategory]);

  // Document metrics
  const stats = useMemo(() => {
    const total = docs.length;
    const contracts = docs.filter(
      (d) => d.category === "Contracts & Agreements" || d.name.toLowerCase().includes("lease")
    ).length;
    const rules = docs.filter(
      (d) => d.category === "House Rules & Regulations" || d.name.toLowerCase().includes("rules")
    ).length;
    const totalBytes = docs.reduce((acc, d) => {
      const sz = typeof d.size === "number" ? d.size : parseInt(String(d.size) || "0", 10);
      return acc + (isNaN(sz) ? 0 : sz);
    }, 0);

    return { total, contracts, rules, totalBytes };
  }, [docs]);

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Documentation Management"
        subtitle="Author, publish, and manage official contracts, property regulations, and guidelines for all tenants"
        action={
          <Button
            variant="primary"
            onClick={() => setUploadModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Upload Document</span>
          </Button>
        }
      />

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-md border border-danger-border bg-danger-bg px-4 py-2.5 text-xs text-danger-fg">
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
        <div className="flex animate-fade-in items-center gap-2 rounded-md border border-success-border bg-success-bg px-4 py-2.5 text-xs text-success-fg">
          <FileText className="h-4 w-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent border border-accent-border">
            <FolderOpen className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted">Total Documents</p>
            <h4 className="text-xl font-bold text-fg mt-0.5">{stats.total}</h4>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <FileCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted">Lease Contracts</p>
            <h4 className="text-xl font-bold text-fg mt-0.5">{stats.contracts}</h4>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted">Rules & Policies</p>
            <h4 className="text-xl font-bold text-fg mt-0.5">{stats.rules}</h4>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <HardDrive className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted">Storage Used</p>
            <h4 className="text-xl font-bold text-fg mt-0.5">
              {formatFileSize(stats.totalBytes)}
            </h4>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex-1 sm:max-w-xs">
            <SearchInput
              placeholder="Search documents by name, category, or note..."
              label="Search documents"
              value={search}
              onChange={setSearch}
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadDocs}
            disabled={loading}
            className="flex items-center gap-2 self-end sm:self-auto text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count =
              cat === "All"
                ? docs.length
                : docs.filter((d) => d.category?.toLowerCase() === cat.toLowerCase()).length;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-accent text-white shadow-soft"
                    : "bg-card border border-edge text-muted hover:text-fg hover:bg-hover"
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] px-1 py-px rounded ${
                    isSelected ? "bg-white/20 text-white" : "bg-inset text-muted"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        <SectionHeader
          icon={<FileText className="h-5 w-5" />}
          title={`Official Documentation (${filteredDocs.length})`}
          subtitle="All documents listed below are published and accessible to active tenants"
        />

        {loading ? (
          <SkeletonCards cards={3} />
        ) : filteredDocs.length === 0 ? (
          <Card className="p-12 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-inset text-muted border border-edge">
              <FolderOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-fg">No documents found</p>
              <p className="text-xs text-muted mt-1">
                {search || selectedCategory !== "All"
                  ? "No documents match your current search or category filter."
                  : "Get started by uploading official documentation for your tenants."}
              </p>
            </div>
            {(search || selectedCategory !== "All") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("All");
                }}
              >
                Clear Filters
              </Button>
            )}
          </Card>
        ) : (
          <Card className="p-0 overflow-hidden divide-y divide-edge">
            {filteredDocs.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                canDelete={true}
                onDownload={handleDownload}
                onDelete={setDeletingDoc}
              />
            ))}
          </Card>
        )}
      </div>

      {/* Modals */}
      <AdminUploadDocModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />

      <UnavailableDocModal
        doc={unavailableDoc}
        onClose={() => setUnavailableDoc(null)}
      />

      <DeleteDocModal
        doc={deletingDoc}
        loading={deleteBusy}
        onClose={() => setDeletingDoc(null)}
        onConfirm={() => deletingDoc && handleDelete(deletingDoc)}
      />
    </div>
  );
}
