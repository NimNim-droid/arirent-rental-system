import { useState, useMemo } from "react";
import {
  CreditCard,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Clock,
  Sparkles,
} from "lucide-react";
import { AlertBanner } from "@/components/ui/alert-banner";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/formatters";
import {
  useTenantBilling,
  TenantBillCard,
  GCashPaymentModal,
  TenantStatementModal,
} from "@/components/features/billing";
import type { Bill } from "@/lib/types";

type BillFilterTab = "all" | "unpaid" | "paid";

export default function TenantBilling() {
  const {
    bills,
    settings,
    selectedInvoice,
    showPaymentModal,
    showStatementModal,
    loading,
    error,
    unpaidBills,
    unpaidTotal,
    loadBills,
    openPayment,
    openStatement,
    closePaymentModal,
    closeStatementModal,
  } = useTenantBilling();

  const [activeTab, setActiveTab] = useState<BillFilterTab>("all");

  const paidBills = useMemo(
    () => bills.filter((b) => b.status === "paid" || b.status === "voided"),
    [bills]
  );

  const displayedUnpaid = useMemo(() => {
    if (activeTab === "paid") return [];
    return unpaidBills;
  }, [activeTab, unpaidBills]);

  const displayedPaid = useMemo(() => {
    if (activeTab === "unpaid") return [];
    return paidBills;
  }, [activeTab, paidBills]);

  // Earliest payable bill for quick settlement
  const nextPayableBill = useMemo(() => {
    return (
      unpaidBills.find(
        (b) =>
          b.status === "unpaid" ||
          b.status === "partially_paid" ||
          b.status === "overdue"
      ) ?? null
    );
  }, [unpaidBills]);

  return (
    <div className="mx-auto w-full max-w-md space-y-5 lg:max-w-4xl">
      {/* Header bar on desktop / large view */}
      <div className="hidden lg:flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg">
            My Bills & Invoices
          </h1>
          <p className="text-xs text-muted mt-0.5">
            View room rent, metered electricity consumption, and settle via GCash
          </p>
        </div>
        {unpaidTotal > 0 && (
          <div className="text-right">
            <span className="text-[11px] font-semibold uppercase text-muted tracking-wider">
              Total Outstanding
            </span>
            <p className="text-xl font-black text-accent tabular-nums">
              {formatCurrency(unpaidTotal)}
            </p>
          </div>
        )}
      </div>

      {error && (
        <AlertBanner variant="danger" message={error} onRetry={loadBills} />
      )}

      {/* Segmented Filter Tabs: Billings (All) | Unpaid | Paid */}
      <div className="flex border-b border-edge">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`relative pb-2.5 px-3 text-sm font-bold transition-colors cursor-pointer ${
            activeTab === "all"
              ? "text-accent"
              : "text-muted hover:text-fg"
          }`}
        >
          Billings
          <span className="ml-1.5 rounded-full bg-hover px-1.5 py-0.5 text-[10px] font-semibold text-muted">
            {bills.length}
          </span>
          {activeTab === "all" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-accent" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("unpaid")}
          className={`relative pb-2.5 px-3 text-sm font-bold transition-colors cursor-pointer ${
            activeTab === "unpaid"
              ? "text-accent"
              : "text-muted hover:text-fg"
          }`}
        >
          Unpaid
          {unpaidBills.length > 0 && (
            <span className="ml-1.5 rounded-full bg-warning-bg px-1.5 py-0.5 text-[10px] font-bold text-warning-fg border border-warning-border">
              {unpaidBills.length}
            </span>
          )}
          {activeTab === "unpaid" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-accent" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("paid")}
          className={`relative pb-2.5 px-3 text-sm font-bold transition-colors cursor-pointer ${
            activeTab === "paid"
              ? "text-accent"
              : "text-muted hover:text-fg"
          }`}
        >
          Paid History
          <span className="ml-1.5 rounded-full bg-hover px-1.5 py-0.5 text-[10px] font-semibold text-muted">
            {paidBills.length}
          </span>
          {activeTab === "paid" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-accent" />
          )}
        </button>
      </div>

      {/* Dark Hero Banner matching mockup slide 1 */}
      {loading ? (
        <Skeleton className="h-28 w-full rounded-3xl" />
      ) : (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#121c32] via-[#1a2846] to-[#0f182c] p-5 text-white shadow-card">
          <div className="relative z-10 flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>Unpaid Bills</span>
                {unpaidBills.length > 0 && (
                  <span className="inline-flex h-2 w-2 rounded-full bg-warning-fg animate-pulse" />
                )}
              </h2>
              <p className="text-xs text-white/75 leading-relaxed max-w-xs">
                {unpaidBills.length > 0
                  ? "Please pay all billings before the due date to avoid late surcharges."
                  : "All caught up! You have no outstanding invoices at this moment."}
              </p>
            </div>

            <div className="text-right shrink-0">
              <p className="text-[10px] uppercase font-bold text-white/60 tracking-wider">
                Total Due
              </p>
              <p className="text-xl sm:text-2xl font-black text-white tabular-nums">
                {formatCurrency(unpaidTotal)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      )}

      {/* Empty State */}
      {!loading && bills.length === 0 && (
        <EmptyState
          title="No invoices yet"
          description="Your monthly billing statements will appear here once issued by the property admin."
        />
      )}

      {/* Section 1: Unpaid Bills */}
      {!loading && displayedUnpaid.length > 0 && (
        <section className="space-y-3" aria-label="Unpaid bills">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
              Pending & Due ({displayedUnpaid.length})
            </h3>
          </div>

          <div className="space-y-3">
            {displayedUnpaid.map((bill) => (
              <TenantBillCard
                key={bill.id}
                bill={bill}
                onView={openStatement}
                onPay={openPayment}
              />
            ))}
          </div>
        </section>
      )}

      {/* Intermediate Banner: Instant Settlement via GCash */}
      {!loading && unpaidTotal > 0 && activeTab !== "paid" && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-edge bg-card p-4 shadow-card">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent text-white shadow-soft">
              <QrCode className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-fg">Instant Settlement</p>
              <p className="text-[11px] text-muted truncate">
                Pay securely via GCash QR & reference upload
              </p>
            </div>
          </div>

          {nextPayableBill && (
            <button
              type="button"
              onClick={() => openPayment(nextPayableBill)}
              className="shrink-0 rounded-xl bg-accent-soft px-3 py-1.5 text-xs font-bold text-accent hover:bg-accent hover:text-white transition-colors cursor-pointer"
            >
              Pay Now
            </button>
          )}
        </div>
      )}

      {/* Section 2: Paid Bills */}
      {!loading && displayedPaid.length > 0 && (
        <section className="space-y-3 pt-2" aria-label="Paid bills">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
              Paid Bills ({displayedPaid.length})
            </h3>
            {activeTab === "all" && paidBills.length > 3 && (
              <button
                type="button"
                onClick={() => setActiveTab("paid")}
                className="text-xs font-semibold text-accent hover:text-accent-strong"
              >
                See all &rarr;
              </button>
            )}
          </div>

          <div className="space-y-3">
            {(activeTab === "all" ? displayedPaid.slice(0, 5) : displayedPaid).map(
              (bill) => (
                <TenantBillCard
                  key={bill.id}
                  bill={bill}
                  onView={openStatement}
                />
              )
            )}
          </div>
        </section>
      )}

      {/* Statement & Receipt Modal */}
      <TenantStatementModal
        open={showStatementModal}
        onClose={closeStatementModal}
        invoice={selectedInvoice}
        onPayGCash={openPayment}
      />

      {/* GCash Payment Modal */}
      <GCashPaymentModal
        open={showPaymentModal}
        onClose={closePaymentModal}
        invoice={selectedInvoice}
        settings={settings}
        onPaymentSuccess={loadBills}
      />
    </div>
  );
}