import type { CSSProperties } from "react";
import { Link, useNavigate } from "react-router";
import {
  CheckCircle2,
  Home,
  Zap,
  Wrench,
  Receipt,
  ArrowRight,
  Mail,
  MapPin,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function TenantDashboard() {
  const navigate = useNavigate();
  const rawUser = localStorage.getItem("arirent_current_user");
  const user = rawUser ? JSON.parse(rawUser) : { name: "Maria Santos", email: "maria@example.com" };

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
            Welcome back, {user.name}!
          </h1>
          <div className="mt-2 flex flex-col gap-2 text-sm text-indigo-100 sm:flex-row sm:items-center sm:gap-4">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> Unit 101 • AriRent Residences - Makati
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-4 w-4" /> {user.email}
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

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Balance Card */}
        <Card
          onClick={() => navigate("/tenant/billing")}
          className="flex flex-col justify-between border-success-border bg-gradient-to-br from-success-bg to-success-bg/30 p-6 animate-fade-in-up stagger"
          style={{ "--i": 0 } as CSSProperties}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-success-fg">
                Account Balance
              </span>
              <CheckCircle2 className="h-5 w-5 text-success-fg" />
            </div>
            <p className="mt-2 text-3xl font-extrabold text-fg tabular-nums">₱0.00</p>
            <p className="mt-1 text-xs font-medium text-success-fg">
              All clear! No outstanding payments.
            </p>
          </div>
          <p className="mt-4 border-t border-success-border/50 pt-2 text-[11px] text-muted">
            Next billing cycle: October 1, 2026
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
            <p className="mt-2 text-3xl font-extrabold text-fg">Room 101</p>
            <p className="mt-1 text-xs font-medium text-muted">
              Rent: ₱5,000 / month • Water: ₱500 / month
            </p>
          </div>
          <p className="mt-4 border-t border-edge pt-2 text-[11px] text-muted">
            Lease expires: January 15, 2027
          </p>
        </Card>

        {/* Utility Consumption */}
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
            <p className="mt-2 text-3xl font-extrabold text-fg tabular-nums">85 kWh</p>
            <p className="mt-1 text-xs font-medium text-muted">
              Latest reading: 1,285 kWh (₱15.00/kWh)
            </p>
          </div>
          <p className="mt-4 border-t border-edge pt-2 text-[11px] text-muted">
            Estimated electric charge: ₱1,275.00
          </p>
        </Card>
      </div>

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