import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ChevronRight } from "lucide-react";
import { AlertBanner } from "@/components/ui/alert-banner";
import { GCashPaymentModal } from "@/components/features/billing";
import { TenantServiceModal } from "@/components/features/maintenance";
import {
  useTenantDashboard,
  TenantStayCard,
  TenantOpenBillCard,
  TenantMaintenanceSummary,
  TenantElectricityCard,
  TenantQuickActions,
  EmergencyHotlineModal,
} from "@/components/features/dashboard";

function SectionTitle({
  title,
  to,
  dot = false,
}: {
  title: string;
  to: string;
  dot?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h2 className="flex items-center gap-2 text-base font-bold tracking-tight text-fg">
        {title}
        {dot && (
          <span className="relative flex h-2 w-2" aria-label="Needs attention">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger-fg opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-danger-fg" />
          </span>
        )}
      </h2>
      <Link
        to={to}
        className="inline-flex items-center gap-0.5 text-xs font-semibold text-accent hover:text-accent-strong"
      >
        See all <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

export default function TenantDashboard() {
  const navigate = useNavigate();
  const {
    user,
    stats,
    unit,
    elec,
    openBill,
    maintenanceCounts,
    latestTicket,
    settings,
    paymentBill,
    openPayment,
    closePayment,
    loading,
    error,
    loadData,
  } = useTenantDashboard();

  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [serviceCategory, setServiceCategory] = useState<"repairs" | "housekeeping">("repairs");
  const [hotlineOpen, setHotlineOpen] = useState(false);

  const firstName = user?.name?.split(" ")[0] || "there";
  const billNeedsAction =
    !!openBill && ["unpaid", "partially_paid", "overdue"].includes(openBill.status);

  const handleReport = () => {
    setServiceCategory("repairs");
    setServiceModalOpen(true);
  };

  const handleCleaning = () => {
    setServiceCategory("housekeeping");
    setServiceModalOpen(true);
  };

  const handlePay = () => {
    if (openBill) {
      openPayment(openBill);
    } else {
      navigate("/tenant/billing");
    }
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-5 lg:max-w-5xl">
      {/* Desktop greeting — on mobile the header bar shows it */}
      <div className="hidden lg:block">
        <p className="text-sm text-muted">Hello,</p>
        <h1 className="text-2xl font-bold tracking-tight text-fg">{firstName}!</h1>
      </div>
      <h1 className="sr-only lg:hidden">Tenant Home</h1>

      {/* Hero Stay Card with Room gold highlight & lease progress */}
      <TenantStayCard unit={unit} loading={loading} />

      {/* Quick Actions (Report, Pay, Cleaning, Hotline) */}
      <TenantQuickActions
        onReport={handleReport}
        onPay={handlePay}
        onCleaning={handleCleaning}
        onHotline={() => setHotlineOpen(true)}
      />

      {error && <AlertBanner variant="danger" message={error} onRetry={loadData} />}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 pt-1">
        <section className="space-y-3" aria-label="Bills">
          <SectionTitle title="Bills" to="/tenant/billing" dot={billNeedsAction} />
          <TenantOpenBillCard
            bill={openBill}
            outstandingBalance={stats?.outstanding_balance ?? 0}
            loading={loading}
            onPay={openPayment}
          />
        </section>

        <section className="space-y-3" aria-label="Electricity">
          <h2 className="text-base font-bold tracking-tight text-fg">Electricity</h2>
          <TenantElectricityCard elec={elec} loading={loading} />
        </section>

        <section className="space-y-3" aria-label="Maintenance">
          <SectionTitle title="Maintenance" to="/tenant/maintenance" />
          <TenantMaintenanceSummary
            openCount={maintenanceCounts.open}
            resolvedCount={maintenanceCounts.resolved}
            latestTicket={latestTicket}
            loading={loading}
          />
        </section>
      </div>

      {/* Emergency Hotline Modal */}
      <EmergencyHotlineModal
        open={hotlineOpen}
        onClose={() => setHotlineOpen(false)}
        phone="0917-222-3333"
      />

      {/* Quick Service / Report Problem Modal */}
      <TenantServiceModal
        open={serviceModalOpen}
        onClose={() => setServiceModalOpen(false)}
        serviceCategory={serviceCategory}
        onSuccess={loadData}
      />

      {/* GCash Settlement Modal */}
      <GCashPaymentModal
        open={!!paymentBill}
        onClose={closePayment}
        invoice={paymentBill}
        settings={settings}
        onPaymentSuccess={loadData}
      />
    </div>
  );
}
