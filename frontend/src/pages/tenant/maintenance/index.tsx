import { useState } from "react";
import {
  Wrench,
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

  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="mx-auto w-full max-w-md space-y-5 lg:max-w-4xl">
      {/* Desktop Page Title (mobile has header bar) */}
      <div className="hidden lg:flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg">Maintenance</h1>
          <p className="text-xs text-muted mt-0.5">
            Submit repair or maintenance requests for your unit
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
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

      {/* ================= 1. Report Maintenance Issue ================= */}
      <section
        aria-label="Add requests"
        className="rounded-3xl border border-edge bg-card p-4 sm:p-5 shadow-card space-y-4"
      >
        <div>
          <h2 className="text-base font-bold text-fg tracking-tight">
            Request Maintenance
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Report plumbing, electrical, appliance, or general unit issues
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="group flex w-full items-center gap-3.5 rounded-2xl border border-edge bg-inset/70 p-4 transition-all duration-150 hover:border-accent-border hover:bg-accent-soft/40 active:scale-[0.99] cursor-pointer text-left"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent border border-accent-border/60 group-hover:scale-105 transition-transform">
            <Wrench className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <span className="block text-xs sm:text-sm font-bold text-fg group-hover:text-accent transition-colors">
              Report a Maintenance Issue
            </span>
            <span className="block text-[11px] text-muted">
              Plumbing, electrical, aircon, or general repairs
            </span>
          </div>
          <Plus className="h-4 w-4 shrink-0 text-muted group-hover:text-accent transition-colors" />
        </button>

        {/* Emergency Hotline (24/7) Banner */}
        <EmergencyHotlineBanner />
      </section>

      {/* ================= 2. My Requests Header ================= */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-bold tracking-tight text-fg">
          My Requests
        </h2>
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-inset border border-edge px-2 text-[11px] font-bold tabular-nums text-muted">
          {tickets.length}
        </span>
      </div>

      {/* ================= 3. Tickets List ================= */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="rounded-3xl border border-edge bg-card p-6 shadow-card">
          <EmptyState
            title="No maintenance requests"
            description="Submit a request anytime for plumbing, electrical, appliances, or general unit repairs."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
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
