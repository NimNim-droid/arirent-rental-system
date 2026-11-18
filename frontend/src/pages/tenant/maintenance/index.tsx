import { useState, useMemo } from "react";
import {
  Wrench,
  Sparkles,
  Plus,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { EmergencyHotlineBanner } from "@/components/common/emergency-hotline-banner";
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
          <h2 className="text-base font-bold text-fg tracking-tight">
            Request a Service
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Select the service type you would like to request for your unit
          </p>
        </div>

        {/* 2 Big Action Tiles: Repairs & Housekeeping */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => handleOpenRequest("repairs")}
            className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-edge bg-inset/70 p-4 transition-all duration-150 hover:border-accent-border hover:bg-accent-soft/40 active:scale-95 cursor-pointer text-center"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-soft text-accent border border-accent-border/60 group-hover:scale-105 transition-transform">
              <Wrench className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <span className="block text-xs sm:text-sm font-bold text-fg group-hover:text-accent transition-colors">
                Repairs
              </span>
              <span className="block text-[11px] text-muted">
                Plumbing, power, AC
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleOpenRequest("housekeeping")}
            className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-edge bg-inset/70 p-4 transition-all duration-150 hover:border-success-border hover:bg-success-bg/40 active:scale-95 cursor-pointer text-center"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-success-bg text-success-fg border border-success-border/60 group-hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <span className="block text-xs sm:text-sm font-bold text-fg group-hover:text-success-fg transition-colors">
                Housekeeping
              </span>
              <span className="block text-[11px] text-muted">
                Unit cleaning & care
              </span>
            </div>
          </button>
        </div>

        {/* Emergency Hotline (24/7) Banner */}
        <EmergencyHotlineBanner />
      </section>

      {/* ================= 2. Segmented Tabs ================= */}
      <div className="flex rounded-2xl bg-inset p-1 border border-edge">
        <button
          type="button"
          onClick={() => setActiveTab("repairs")}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "repairs"
              ? "bg-brand-navy text-white shadow-soft"
              : "text-muted hover:text-fg"
          }`}
        >
          <span>Repair requests</span>
          {repairTickets.length > 0 && (
            <span
              className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums ${
                activeTab === "repairs"
                  ? "bg-white/20 text-white"
                  : "bg-hover text-muted"
              }`}
            >
              {repairTickets.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("housekeeping")}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "housekeeping"
              ? "bg-brand-navy text-white shadow-soft"
              : "text-muted hover:text-fg"
          }`}
        >
          <span>Housekeeping</span>
          {housekeepingTickets.length > 0 && (
            <span
              className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums ${
                activeTab === "housekeeping"
                  ? "bg-white/20 text-white"
                  : "bg-warning-bg text-warning-fg"
              }`}
            >
              {housekeepingTickets.length}
            </span>
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
        <div className="rounded-3xl border border-edge bg-card p-6 shadow-card">
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
        </div>
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