import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router";
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
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/formatters";
import { billingService } from "@/lib/services/billing";
import { getErrorMessage } from "@/lib/errors";
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
    pendingCharges,
    pendingChargesTotal,
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

  const [activeTab, setActiveTab] = useState<BillFilterTab>("unpaid");
  const [searchParams, setSearchParams] = useSearchParams();
  const [xenditFeedback, setXenditFeedback] = useState<{
    tone: "success" | "warning" | "danger";
    message: string;
  } | null>(null);

  useEffect(() => {
    const xenditStatus = searchParams.get("xendit_status");
    const billId = searchParams.get("bill_id");
    const externalId = searchParams.get("external_id") ?? undefined;

    if (!xenditStatus || !billId) return;

    // Clean query params immediately so page refreshes do not re-run verification
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("xendit_status");
    nextParams.delete("bill_id");
    nextParams.delete("external_id");
    setSearchParams(nextParams, { replace: true });

    if (xenditStatus === "cancelled") {
      setXenditFeedback({
        tone: "warning",
        message: "Online checkout was cancelled. You can retry anytime before the due date.",
      });
      return;
    }

    if (xenditStatus === "success") {
      let active = true;
      (async () => {
        try {
          const res = await billingService.verifyXenditPayment(billId, {
            external_id: externalId,
          });
          if (!active) return;
          setXenditFeedback({
            tone: "success",
            message: res.message || "Online payment confirmed via Xendit!",
          });
          await loadBills();
        } catch (err) {
          if (!active) return;
          setXenditFeedback({
            tone: "danger",
            message: getErrorMessage(err, "Unable to verify Xendit payment status yet."),
          });
        }
      })();
      return () => {
        active = false;
      };
    }
  }, [searchParams, setSearchParams, loadBills]);

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
            My Bills
          </h1>
          <p className="text-xs text-muted mt-0.5">
            View room rent, metered electricity consumption, and pay online via Xendit (GCash, Maya, Bank, Card)
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

      {xenditFeedback && (
        <AlertBanner
          variant={xenditFeedback.tone}
          message={xenditFeedback.message}
        />
      )}

      {/* Amount Due Summary Header */}
      <div className="rounded-3xl border border-edge bg-card p-5 shadow-card space-y-2.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Amount due</p>
        <p className="text-3xl sm:text-4xl font-extrabold text-fg tabular-nums tracking-tight">
          {formatCurrency(unpaidTotal)}
        </p>
        {unpaidTotal === 0 ? (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-success-bg border border-success-border px-3 py-1 text-xs font-semibold text-success-fg">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            <span>Nothing to pay right now</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 rounded-xl bg-warning-bg border border-warning-border/80 px-3 py-1.5 text-xs font-medium text-warning-fg">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>Please pay before the due date to avoid late surcharges</span>
          </div>
        )}
      </div>

      {/* Segmented Filter: [ Unpaid | Paid ] */}
      <div className="flex rounded-2xl bg-inset p-1 border border-edge">
        <button
          type="button"
          onClick={() => setActiveTab("unpaid")}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "unpaid"
              ? "bg-brand-navy text-white shadow-soft"
              : "text-muted hover:text-fg"
            }`}
        >
          <span>Unpaid</span>
          {unpaidBills.length > 0 && (
            <span
              className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums ${
                activeTab === "unpaid"
                  ? "bg-[#DFB966] text-[#152238]"
                  : "bg-warning-bg text-warning-fg border border-warning-border"
              }`}
            >
              {unpaidBills.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("paid")}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "paid"
              ? "bg-brand-navy text-white shadow-soft"
              : "text-muted hover:text-fg"
            }`}
        >
          <span>Paid ({paidBills.length})</span>
        </button>
      </div>

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
          title="No bills yet"
          description="Your monthly billing statements will appear here once issued by the property admin."
        />
      )}

      {/* Empty State when in Unpaid tab with 0 unpaid bills */}
      {!loading && activeTab === "unpaid" && unpaidBills.length === 0 && bills.length > 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-edge bg-card p-8 text-center shadow-card space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-success-bg text-success-fg">
            <CheckCircle2 className="h-6 w-6 stroke-[2.25]" />
          </div>
          <p className="text-base font-bold text-fg">No unpaid bills</p>
          <p className="text-xs text-muted max-w-xs">
            You're all caught up! Your next billing statement will show up here.
          </p>
        </div>
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
              <p className="text-xs font-bold text-fg">Instant Online Settlement</p>
              <p className="text-[11px] text-muted leading-snug">
                Pay via GCash, Maya, Bank Transfer, Card, or QR Ph
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

      {/* Upcoming unbilled add-on fees (appliance permit, maintenance, etc.) */}
      {!loading && pendingCharges.length > 0 && activeTab !== "paid" && (
        <div className="rounded-2xl border border-warning-border/60 bg-warning-bg/20 p-4 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-fg">
                <Clock className="h-3.5 w-3.5 text-warning-fg" />
                <span>Upcoming Add-on Charges</span>
              </div>
              <p className="text-[11px] text-muted">
                These itemized fees will be included in your next billing statement.
              </p>
            </div>
            <Badge variant="warning" className="shrink-0 tabular-nums font-bold">
              {formatCurrency(pendingChargesTotal)}
            </Badge>
          </div>
          <div className="mt-3 divide-y divide-edge/60 border-t border-edge/60 pt-1">
            {pendingCharges.map((charge) => (
              <div key={charge.id} className="flex items-center justify-between py-2 text-xs">
                <div className="min-w-0 pr-3">
                  <p className="font-semibold text-fg truncate">{charge.title}</p>
                  {charge.description && (
                    <p className="text-[11px] text-muted truncate">{charge.description}</p>
                  )}
                </div>
                <span className="shrink-0 font-bold tabular-nums text-fg">
                  {formatCurrency(charge.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State when in Paid tab with 0 paid bills */}
      {!loading && activeTab === "paid" && paidBills.length === 0 && bills.length > 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-edge bg-card p-8 text-center shadow-card space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-inset text-muted">
            <Receipt className="h-6 w-6 stroke-[2.25]" />
          </div>
          <p className="text-base font-bold text-fg">No paid history yet</p>
          <p className="text-xs text-muted max-w-xs">
            Past settled receipts and statements will appear here.
          </p>
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