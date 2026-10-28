import { Link } from "react-router";
import { Wrench, Banknote, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useTenantDashboard,
  TenantBalanceCard,
  TenantUnitCard,
} from "@/components/features/dashboard";

export default function TenantDashboard() {
  const { user, stats, unit, elec, hasBalance, loading, error, loadData } =
    useTenantDashboard();

  return (
    <div className="space-y-6">
      {/* 1. Resident Welcome & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight text-fg">
            Welcome back,{" "}
            <span className="text-accent">{user?.name?.split(" ")[0]}</span>
          </h1>
          {unit ? (
            <p className="mt-1 text-xs text-muted">
              Room {unit.room} &bull; {unit.property_name}
            </p>
          ) : loading ? (
            <div className="mt-1.5">
              <Skeleton className="h-3 w-40" />
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link to="/tenant/maintenance">
            <Button size="sm" variant="secondary" className="text-xs">
              <Wrench className="h-3.5 w-3.5" />
              Report Issue
            </Button>
          </Link>
          <Link to="/tenant/billing">
            <Button size="sm" className="text-xs">
              <Banknote className="h-3.5 w-3.5" />
              View Invoices
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-md border border-danger-border bg-danger-bg px-4 py-2.5 text-xs text-danger-fg">
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

      {/* 2. Primary Balance Card */}
      <TenantBalanceCard
        stats={stats}
        loading={loading}
        hasBalance={hasBalance}
      />

      {/* 3. Unit & Electricity Consumption Details */}
      <TenantUnitCard unit={unit} elec={elec} loading={loading} />
    </div>
  );
}