import { useState, useMemo } from "react";
import {
  FileText,
  Search,
  Download,
  Building2,
  Phone,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatFileSize } from "@/lib/formatters";
import {
  useDocuments,
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
    error: docsError,
    loading: docsLoading,
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
        (doc.category &&
          doc.category.toLowerCase().includes(search.toLowerCase())) ||
        (doc.description &&
          doc.description.toLowerCase().includes(search.toLowerCase()));

      const matchesCategory =
        selectedCategory === "All" ||
        (doc.category &&
          doc.category.toLowerCase() === selectedCategory.toLowerCase());

      return matchesSearch && matchesCategory;
    });
  }, [docs, search, selectedCategory]);

  return (
    <div className="mx-auto w-full max-w-md space-y-5 lg:max-w-4xl animate-fade-in">
      {/* Desktop Header Bar */}
      <div className="hidden lg:flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg">
            Property Documentation
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Official lease contracts, house rules, and property guidelines
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadDocs}
          disabled={docsLoading}
          className="text-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${docsLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {docsError && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-danger-border bg-danger-bg p-3.5 text-xs font-semibold text-danger-fg shadow-card">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{docsError}</span>
          </span>
          <button
            type="button"
            onClick={loadDocs}
            className="flex items-center gap-1 font-bold underline"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      )}

      {/* ================= Search & Category Filters ================= */}
      <section aria-label="Document filters" className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-faint pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents by name or keyword..."
            aria-label="Search documents"
            className="w-full rounded-2xl border border-edge bg-card pl-10 pr-4 py-2.5 text-xs sm:text-sm text-fg shadow-card placeholder:text-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
          />
        </div>

        {/* Horizontal Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count =
              cat === "All"
                ? docs.length
                : docs.filter(
                    (d) => d.category?.toLowerCase() === cat.toLowerCase()
                  ).length;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer select-none active:scale-95 ${
                  isSelected
                    ? "bg-accent text-white shadow-soft"
                    : "bg-card border border-edge text-muted hover:text-fg hover:bg-hover"
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-inset text-muted border border-edge/60"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ================= Documents List ================= */}
      <section aria-label="Available documents" className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
            Available Documents ({filteredDocs.length})
          </h3>
        </div>

        {docsLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="rounded-3xl border border-edge bg-card p-6 shadow-card">
            <EmptyState
              title={search ? "No matching documents" : "No documents available"}
              description={
                search
                  ? "Try searching with a different keyword or select another category."
                  : "Your property landlord hasn't published any documents yet."
              }
            />
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredDocs.map((doc) => {
              const extension = doc.type
                ? doc.type.split("/").pop()?.toUpperCase()
                : "PDF";

              return (
                <div
                  key={doc.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-edge bg-card p-3.5 shadow-card hover:border-edge-strong transition-all duration-150"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                      <FileText className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <h4 className="font-bold text-xs sm:text-sm text-fg truncate">
                        {doc.name}
                      </h4>

                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
                        <span className="font-bold text-accent uppercase tracking-wider text-[10px]">
                          {extension || "PDF"}
                        </span>
                        <span>&bull;</span>
                        <span className="tabular-nums">
                          {formatFileSize(doc.size)}
                        </span>
                        {doc.uploaded_at && (
                          <>
                            <span>&bull;</span>
                            <span>{formatDate(doc.uploaded_at)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDownload(doc)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-hover text-fg hover:bg-accent hover:text-white transition-colors cursor-pointer active:scale-95 shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    title={`Download ${doc.name}`}
                    aria-label={`Download ${doc.name}`}
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ================= Property Admin Hotline Contact ================= */}
      <div className="flex items-center justify-between rounded-2xl border border-edge bg-card p-3.5 shadow-card">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-info-bg text-info-fg">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-fg">Have questions about your lease?</p>
            <p className="text-[11px] text-muted truncate">
              Contact your building administrator or 24/7 hotline
            </p>
          </div>
        </div>
        <a
          href="tel:09172223333"
          className="shrink-0 inline-flex items-center gap-1 rounded-xl bg-hover px-3 py-1.5 text-xs font-bold text-fg hover:bg-accent hover:text-white transition-colors"
        >
          <Phone className="h-3 w-3" /> Call
        </a>
      </div>

      {/* Unavailable Doc Modal */}
      <UnavailableDocModal
        doc={unavailableDoc}
        onClose={() => setUnavailableDoc(null)}
      />
    </div>
  );
}