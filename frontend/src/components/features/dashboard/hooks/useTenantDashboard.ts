import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { dashboardService } from "@/lib/services/dashboard";
import { billingService } from "@/lib/services/billing";
import { maintenanceService } from "@/lib/services/maintenance";
import { useAuth } from "@/lib/auth-context";
import { getErrorMessage } from "@/lib/errors";
import type { Bill, TenantDashboardData, TicketStatusCounts } from "@/lib/types";

/** Statuses where the tenant still needs to pay something. */
const PAYABLE_STATUSES: Bill["status"][] = ["unpaid", "partially_paid", "overdue"];

/**
 * Picks the bill to feature on the home screen:
 * the earliest-due payable bill, otherwise the earliest bill awaiting approval.
 */
function pickOpenBill(bills: Bill[]): Bill | null {
  const byDueDate = (a: Bill, b: Bill) => a.due_date.localeCompare(b.due_date);
  const payable = bills.filter((b) => PAYABLE_STATUSES.includes(b.status)).sort(byDueDate);
  if (payable.length > 0) return payable[0];
  const pending = bills.filter((b) => b.status === "pending_verification").sort(byDueDate);
  return pending[0] ?? null;
}

export function useTenantDashboard() {
  const navigate = useNavigate();
  const { user, initializing } = useAuth();
  const [stats, setStats] = useState<TenantDashboardData | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [ticketCounts, setTicketCounts] = useState<TicketStatusCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentBill, setPaymentBill] = useState<Bill | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    // Same query params as the Bills / Maintenance pages so the client cache is shared.
    const [dashRes, billsRes, ticketsRes] = await Promise.allSettled([
      dashboardService.getTenantDashboard(),
      billingService.getBills({ per_page: 100 }),
      maintenanceService.getTickets({ per_page: 100 }),
    ]);

    if (dashRes.status === "fulfilled") {
      setStats(dashRes.value);
    } else {
      setError(getErrorMessage(dashRes.reason, "Unable to load your dashboard."));
    }

    if (billsRes.status === "fulfilled") setBills(billsRes.value.data);
    if (ticketsRes.status === "fulfilled") {
      setTicketCounts(ticketsRes.value.meta?.status_counts ?? null);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (!initializing) {
      if (!user) {
        navigate("/login");
        return;
      }
      loadData();
    }
  }, [user, initializing, loadData, navigate]);

  const unit = stats?.unit;
  const elec = stats?.electricity;
  const hasBalance = (stats?.outstanding_balance ?? 0) > 0;

  const openBill = useMemo(() => pickOpenBill(bills), [bills]);

  // Prefer accurate server-side counts; fall back to the recent tickets preview.
  const maintenanceCounts = useMemo(() => {
    if (ticketCounts) {
      return {
        open: ticketCounts.pending + ticketCounts.in_progress,
        resolved: ticketCounts.resolved,
      };
    }
    const recent = stats?.recent_maintenance ?? [];
    return {
      open: recent.filter((t) => t.status === "pending" || t.status === "in_progress").length,
      resolved: recent.filter((t) => t.status === "resolved").length,
    };
  }, [ticketCounts, stats]);

  const latestTicket = stats?.recent_maintenance?.[0] ?? null;

  const openPayment = (bill: Bill) => setPaymentBill(bill);
  const closePayment = () => setPaymentBill(null);

  return {
    user,
    stats,
    unit,
    elec,
    hasBalance,
    openBill,
    maintenanceCounts,
    latestTicket,
    settings: stats?.settings ?? null,
    paymentBill,
    openPayment,
    closePayment,
    loading,
    error,
    loadData,
  };
}
