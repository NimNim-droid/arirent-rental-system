import { useState, useMemo, useEffect, useCallback } from "react";
import { FileText, FolderOpen, RefreshCw, AlertTriangle, Plus } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { SectionHeader } from "@/components/common/section-header";
import { SearchInput } from "@/components/common/search-input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonRows } from "@/components/ui/skeleton";
import { documentsService } from "@/lib/services/documents";
import { getErrorMessage } from "@/lib/errors";
import type { DocumentItem } from "@/lib/types";
import {
  DocumentCard,
  AdminUploadDocModal,
  UnavailableDocModal,
  DeleteDocModal,
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
      setDocs(res ?? []);
    } catch (err) {
      setDocs([]);
      setError(getErrorMessage(err, "Unable to load documents."));
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

  return (
    <div className="space-y-6 animate-fade-in">
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
          icon={<FileText className="h-4 w-4" />}
          title={`Official Documentation (${filteredDocs.length})`}
          subtitle="All documents listed below are published and accessible to active tenants"
        />

        {loading ? (
          <Card className="p-4">
            <SkeletonRows rows={4} />
          </Card>
        ) : filteredDocs.length === 0 ? (
          <Card className="p-0 overflow-hidden">
            {error ? (
              <EmptyState
                icon={<AlertTriangle className="h-4 w-4" />}
                title="Unable to load documents"
                description={error}
              />
            ) : search || selectedCategory !== "All" ? (
              <EmptyState
                icon={<FolderOpen className="h-4 w-4" />}
                title="No documents match"
                description="No documents match your current search or category filter."
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearch("");
                      setSelectedCategory("All");
                    }}
                  >
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={<FolderOpen className="h-4 w-4" />}
                title="No documents yet"
                description="Publish your first document and it becomes available to all tenants immediately."
                action={
                  <Button variant="primary" size="sm" onClick={() => setUploadModalOpen(true)}>
                    <Plus className="h-3.5 w-3.5" />
                    Upload document
                  </Button>
                }
              />
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
