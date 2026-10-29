import { useState, useMemo } from "react";
import {
  Wrench,
  Sparkles,
  Phone,
  Plus,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useTenantMaintenance,
  TenantServiceCard,
  TenantServiceModal,
  TicketDetailModal,
} from "@/components/features/maintenance";

type ServiceTab = "repairs" | "housekeeping";

export default function TenantMaintenance() {
  const {
    tickets,
    loading,
    error,
    notice,
    selectedTicket,
    setSelectedTicket,
    loadTickets,
  } = useTenantMaintenance();

  const [activeTab, setActiveTab] = useState<ServiceTab>("repairs");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<
    "repairs" | "housekeeping"
  >("repairs");

  // Repairs: plumbing, electrical, appliances (or anything not classified as general housekeeping)
  const repairTickets = useMemo(
    () => tickets.filter((t) => t.type !== "general"),
    [tickets]
  );

  // Housekeeping / General
  const housekeepingTickets = useMemo(
    () => tickets.filter((t) => t.type === "general"),
    [tickets]
  );

  const displayedTickets =
    activeTab === "repairs" ? repairTickets : housekeepingTickets;

  const handleOpenRequest = (category: "repairs" | "housekeeping") => {
    setSelectedCategory(category);
    setModalOpen(true);
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-5 lg:max-w-4xl">
      {/* Desktop Page Title (mobile has header bar) */}
      <div className="hidden lg:flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg">Services</h1>
          <p className="text-xs text-muted mt-0.5">
            Submit repairs, request housekeeping, or contact property maintenance
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleOpenRequest("repairs")}
          className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3.5 py-2 text-xs font-semibold text-white shadow-soft hover:bg-accent-strong transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" /> New Request
        </button>
      </div>

      {notice && (
        <div className="flex items-center gap-2 rounded-2xl border border-success-border bg-success-bg p-3.5 text-xs font-semibold text-success-fg shadow-card animate-fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-danger-border bg-danger-bg p-3.5 text-xs font-semibold text-danger-fg shadow-card">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </span>
          <button
            type="button"
            onClick={loadTickets}
            className="flex items-center gap-1 font-bold underline"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      )}

      {/* ================= 1. Add Requests Here ================= */}
      <section
        aria-label="Add requests"
        className="rounded-3xl border border-edge bg-card p-4 sm:p-5 shadow-card space-y-4"
      >
        <div>
          <h2 className="text-base font-extrabold text-fg tracking-tight">
            Add requests here
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Select the service type you would like to request
          </p>
        </div>

        {/* 2 Big Action Tiles: Repairs & Housekeeping */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => handleOpenRequest("repairs")}
            className="group flex flex-col items-center justify-center gap-2.5 rounded-2xl border border-edge bg-hover/40 p-4 sm:p-5 transition-all duration-150 hover:border-accent/40 hover:bg-accent-soft/30 active:scale-95 cursor-pointer text-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card border border-edge text-accent shadow-card group-hover:scale-110 transition-transform">
              <Wrench className="h-6 w-6" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-fg group-hover:text-accent transition-colors">
              Repairs
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenRequest("housekeeping")}
            className="group flex flex-col items-center justify-center gap-2.5 rounded-2xl border border-edge bg-hover/40 p-4 sm:p-5 transition-all duration-150 hover:border-accent/40 hover:bg-accent-soft/30 active:scale-95 cursor-pointer text-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card border border-edge text-accent shadow-card group-hover:scale-110 transition-transform">
              <Sparkles className="h-6 w-6" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-fg group-hover:text-accent transition-colors">
              Housekeeping
            </span>
          </button>
        </div>

        {/* Emergency Hotline (24/7) Banner */}
        <div className="flex items-center justify-between rounded-2xl border border-[#fedf89] bg-[#fffaeb] dark:border-[#78350f] dark:bg-[#451a03]/40 p-3 sm:p-3.5 shadow-soft">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fef08a] dark:bg-[#78350f] text-[#b45309] font-bold">
              <Phone className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-fg">Emergency Hotline (24/7)</p>
              <p className="text-xs font-extrabold text-[#b45309] dark:text-[#fef08a] tracking-tight">
                0917-222-3333
              </p>
            </div>
          </div>
          <a
            href="tel:09172223333"
            className="shrink-0 rounded-xl bg-[#fef08a] dark:bg-[#78350f] px-3.5 py-1.5 text-xs font-bold text-[#b45309] dark:text-[#fef08a] hover:opacity-90 active:scale-95 transition-all shadow-soft"
          >
            Call
          </a>
        </div>
      </section>

      {/* ================= 2. Segmented Tabs ================= */}
      <div className="flex border-b border-edge">
        <button
          type="button"
          onClick={() => setActiveTab("repairs")}
          className={`relative pb-2.5 px-4 text-sm font-bold transition-colors cursor-pointer ${
            activeTab === "repairs" ? "text-accent" : "text-muted hover:text-fg"
          }`}
        >
          Repair requests
          {repairTickets.length > 0 && (
            <span className="ml-1.5 rounded-full bg-hover px-1.5 py-0.5 text-[10px] font-semibold text-muted">
              {repairTickets.length}
            </span>
          )}
          {activeTab === "repairs" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-accent" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("housekeeping")}
          className={`relative pb-2.5 px-4 text-sm font-bold transition-colors cursor-pointer ${
            activeTab === "housekeeping"
              ? "text-accent"
              : "text-muted hover:text-fg"
          }`}
        >
          Housekeeping requests
          {housekeepingTickets.length > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-[#f97316] text-[10px] font-bold text-white">
              {housekeepingTickets.length}
            </span>
          )}
          {activeTab === "housekeeping" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-accent" />
          )}
        </button>
      </div>

      {/* ================= 3. Tickets List ================= */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : displayedTickets.length === 0 ? (
        <EmptyState
          title={
            activeTab === "repairs"
              ? "No repair requests"
              : "No housekeeping requests"
          }
          description={
            activeTab === "repairs"
              ? "Submit a repair request anytime for plumbing, electrical, or appliances."
              : "Request housekeeping or common area maintenance for your unit."
          }
        />
      ) : (
        <div className="space-y-3">
          {displayedTickets.map((ticket) => (
            <TenantServiceCard
              key={ticket.id}
              ticket={ticket}
              onSelect={setSelectedTicket}
            />
          ))}
        </div>
      )}

      {/* New Request Modal */}
      <TenantServiceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        serviceCategory={selectedCategory}
        onSuccess={loadTickets}
      />

      {/* Ticket Detail Modal */}
      <TicketDetailModal
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
      />
    </div>
  );
}