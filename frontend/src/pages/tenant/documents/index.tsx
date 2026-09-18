import { useState, useMemo } from "react";
import {
  AlertTriangle,
  FileText,
  FolderOpen,
  RefreshCw,
  Search,
  ShieldCheck,
  Info,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { SectionHeader } from "@/components/common/section-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkeletonCards } from "@/components/ui/skeleton";
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
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Property Documentation"
        subtitle="Official lease contract, house regulations, and property guidelines provided by your landlord"
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

      {/* Official Landlord Notice Banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-accent-border bg-accent-soft/40 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-white shadow-sm mt-0.5">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-fg">Verified Landlord Documentation</h4>
          <p className="text-xs text-muted mt-0.5 leading-relaxed">
            The documentation below contains all legal agreements, property rules, and guidelines
            governing your tenancy. All documents are issued by your landlord and available for you
            to view or download anytime.
          </p>
        </div>
      </div>

      {/* Search and Category Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="text"
              placeholder="Search documents by name or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-edge bg-inset pl-10 pr-4 py-2 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
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
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "bg-accent text-white shadow-sm"
                    : "bg-card border border-edge text-muted hover:text-fg hover:border-accent/40"
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? "bg-white/20 text-white" : "bg-hover text-muted"
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
          icon={<FolderOpen className="h-5 w-5" />}
          title={`Available Documents (${filteredDocs.length})`}
          subtitle="Click download to save a copy of any document to your device"
        />

        {loading ? (
          <SkeletonCards cards={3} />
        ) : filteredDocs.length === 0 ? (
          <Card className="p-10 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-inset text-muted border border-edge">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-fg">No documents found</p>
              <p className="text-xs text-muted mt-1">
                {search || selectedCategory !== "All"
                  ? "No documents match your current filter."
                  : "No documents have been published by your landlord yet."}
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