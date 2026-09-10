import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { Link, useNavigate } from "react-router";
import {
  CheckCircle2,
  AlertCircle,
  Home,
  Zap,
  Wrench,
  Receipt,
  ArrowRight,
  Mail,
  MapPin,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkeletonCards } from "@/components/ui/skeleton";
import { dashboardService } from "@/lib/services/dashboard";
import { getErrorMessage } from "@/lib/errors";
import { useAuth } from "@/lib/auth-context";
import type { TenantDashboardData } from "@/lib/types";

export default function TenantDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<TenantDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await dashboardService.getTenantDashboard();
      setStats(res);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load your dashboard."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const unit = stats?.unit;
  const elec = stats?.electricity;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-400/30 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 p-8 shadow-pop flex flex-col sm:flex-row sm:items-center justify-between gap-6 animate-fade-in-up">
        <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
        <div className="relative">
          <span className="mb-3 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-100 ring-1 ring-inset ring-white/20 backdrop-blur-sm">
            Resident Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Welcome back, {user?.name}!
          </h1>
          <div className="mt-2 flex flex-col gap-2 text-sm text-indigo-100 sm:flex-row sm:items-center sm:gap-4">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {unit ? `Unit ${unit.room} • ${unit.property_name}` : "Unit assignment pending"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-4 w-4" /> {user?.email}
            </span>
          </div>
        </div>
        <Link to="/tenant/billing">
          <Button variant="secondary" className="relative border-white/30 bg-white/15 text-white shadow-lg backdrop-blur-sm hover:bg-white/25 hover:text-white">
            <Receipt className="h-4 w-4" />
            View My Invoices
          </Button>
        </Link>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-xs font-semibold text-danger-fg">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </span>
          <Button variant="ghost" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      )}

      {/* Main Grid */}
      {loading ? (
        <SkeletonCards cards={3} />
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Balance Card */}
          <Card
            onClick={() => navigate("/tenant/billing")}
            className={`flex flex-col justify-between p-6 animate-fade-in-up stagger ${
              (stats.outstanding_balance ?? 0) > 0
                ? "border-warning-border bg-gradient-to-br from-warning-bg to-warning-bg/30"
                : "border-success-border bg-gradient-to-br from-success-bg to-success-bg/30"
            }`}
            style={{ "--i": 0 } as CSSProperties}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-fg-soft">
                  Account Balance
                </span>
                {(stats.outstanding_balance ?? 0) > 0 ? (
                  <AlertCircle className="h-5 w-5 text-warning-fg" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-success-fg" />
                )}
              </div>
              <p className="mt-2 text-3xl font-extrabold text-fg tabular-nums">
                ₱{(stats.outstanding_balance ?? 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </p>
              {(stats.outstanding_balance ?? 0) > 0 ? (
                <p className="mt-1 text-xs font-medium text-warning-fg">
                  Outstanding balance due soon
                </p>
              ) : (
                <p className="mt-1 text-xs font-medium text-success-fg">
                  All clear! No outstanding payments.
                </p>
              )}
            </div>
            <p className="mt-4 border-t border-edge pt-2 text-[11px] text-muted">
              {stats.due_date
                ? `Next due date: ${stats.due_date}`
                : "No upcoming due date"}
            </p>
          </Card>

          {/* Assigned Room Card */}
          <Card
            onClick={() => navigate("/tenant/billing")}
            className="flex flex-col justify-between p-6 animate-fade-in-up stagger"
            style={{ "--i": 1 } as CSSProperties}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  My Unit
                </span>
                <Home className="h-5 w-5 text-accent" />
              </div>
              <p className="mt-2 text-3xl font-extrabold text-fg">
                {unit ? `Room ${unit.room}` : "Unassigned"}
              </p>
              <p className="mt-1 text-xs font-medium text-muted">
                {unit ? (
                  <>
                    Rent: ₱{unit.rent.toLocaleString()} / month • Water: ₱
                    {unit.water_rate.toLocaleString()} / month
                  </>
                ) : (
                  "Your room details will appear once your account is approved."
                )}
              </p>
            </div>
            <p className="mt-4 border-t border-edge pt-2 text-[11px] text-muted">
              {unit?.lease_end
                ? `Lease expires: ${unit.lease_end}`
                : "Lease expiration not set"}
            </p>
          </Card>

          {/* Utility Consumption */}
          {elec && (
            <Card
              onClick={() => navigate("/tenant/billing")}
              className="flex flex-col justify-between p-6 animate-fade-in-up stagger"
              style={{ "--i": 2 } as CSSProperties}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                    Electricity Usage
                  </span>
                  <Zap className="h-5 w-5 text-warning-fg" />
                </div>
                <p className="mt-2 text-3xl font-extrabold text-fg tabular-nums">
                  {elec.usage_kwh} kWh
                </p>
                <p className="mt-1 text-xs font-medium text-muted">
                  Latest reading: {elec.latest_reading.toLocaleString()} kWh (₱
                  {elec.elec_rate}/kWh)
                </p>
              </div>
              <p className="mt-4 border-t border-edge pt-2 text-[11px] text-muted">
                Estimated electric charge: ₱{elec.estimated_charge.toFixed(2)}
              </p>
            </Card>
          )}
        </div>
      ) : null}

      {/* Quick Access Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card
          onClick={() => navigate("/tenant/maintenance")}
          className="flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center animate-fade-in-up stagger"
          style={{ "--i": 0 } as CSSProperties}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-warning-bg text-warning-fg ring-1 ring-inset ring-warning-border">
              <Wrench className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-fg">Need something fixed?</h3>
              <p className="text-xs text-muted">Submit a repair request to building maintenance</p>
            </div>
          </div>
          <Link
            to="/tenant/maintenance"
            className="shrink-0"
            onClick={(e) => e.stopPropagation()}
            aria-label="Go to maintenance"
          >
            <Button size="sm">
              Request Repair <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </Card>

        <Card
          onClick={() => navigate("/tenant/billing")}
          className="flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center animate-fade-in-up stagger"
          style={{ "--i": 1 } as CSSProperties}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-accent-soft text-accent ring-1 ring-inset ring-accent-border">
              <Receipt className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-fg">Pay via GCash</h3>
              <p className="text-xs text-muted">View official QR code and submit payment receipt</p>
            </div>
          </div>
          <Link
            to="/tenant/billing"
            className="shrink-0"
            onClick={(e) => e.stopPropagation()}
            aria-label="Go to billing"
          >
            <Button variant="secondary" size="sm">
              Pay Online <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}