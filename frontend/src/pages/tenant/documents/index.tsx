import { useState, useMemo } from "react";
import { AlertTriangle, FolderOpen, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { SectionHeader } from "@/components/common/section-header";
import { SearchInput } from "@/components/common/search-input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonRows } from "@/components/ui/skeleton";
import {
  useDocuments,
  DocumentCard,
  UnavailableDocModal,
} from "@/components/features/documents";

const CATEGORIES = [
  "All",
  "Contracts & Agreements",
  "House Rules & Regulations",
  "Checklists & Guides",
  "Notices & Policies",
];

export default function TenantDocuments() {
  const {
    docs,
    error,
    loading,
    unavailableDoc,
    setUnavailableDoc,
    loadDocs,
    handleDownload,
  } = useDocuments();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

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
        title="Property Documentation"
        subtitle="Official lease contract, house regulations, and property guidelines provided by your landlord"
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

      {/* Search and Category Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex-1 sm:max-w-xs">
            <SearchInput
              placeholder="Search documents by name or keyword..."
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

      {/* Document Files List */}
      <div className="space-y-4">
        <SectionHeader
          icon={<FolderOpen className="h-4 w-4" />}
          title={`Available Documents (${filteredDocs.length})`}
          subtitle="Click download to save a copy of any document to your device"
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
                description="Your landlord hasn't published any documents yet. Check back soon."
              />
            )}
          </Card>
        ) : (
          <Card className="p-0 overflow-hidden divide-y divide-edge">
            {filteredDocs.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                canDelete={false}
                onDownload={handleDownload}
              />
            ))}
          </Card>
        )}
      </div>

      {/* Unavailable Doc Modal */}
      <UnavailableDocModal
        doc={unavailableDoc}
        onClose={() => setUnavailableDoc(null)}
      />
    </div>
  );
}