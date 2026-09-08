import { Link } from "react-router";
import { CheckCircle2, Home, Zap, Wrench, Receipt, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function TenantDashboard() {
  const rawUser = localStorage.getItem("arirent_current_user");
  const user = rawUser ? JSON.parse(rawUser) : { name: "Maria Santos", email: "maria@example.com" };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-sky-600 to-sky-500 p-8 text-white shadow-lg shadow-sky-600/15 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            Resident Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-black">Welcome back, {user.name}!</h1>
          <p className="text-sky-100 text-sm mt-1">
            Unit 101 • AriRent Residences - Makati
          </p>
        </div>
        <Link to="/tenant/billing">
          <Button variant="secondary" className="bg-white text-sky-700 hover:bg-sky-50 shadow-md">
            <Receipt className="h-4 w-4" />
            View My Invoices
          </Button>
        </Link>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Balance Card */}
        <Card className="p-6 border-emerald-200 bg-emerald-50/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Account Balance
              </span>
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="text-3xl font-black text-emerald-800 mt-2">₱0.00</p>
            <p className="text-xs text-emerald-600 font-medium mt-1">
              All clear! No outstanding payments.
            </p>
          </div>
          <p className="text-[11px] text-slate-400 mt-4 border-t border-emerald-100 pt-2">
            Next billing cycle: October 1, 2026
          </p>
        </Card>

        {/* Assigned Room Card */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                My Unit
              </span>
              <Home className="h-5 w-5 text-sky-600" />
            </div>
            <p className="text-3xl font-black text-slate-900 mt-2">Room 101</p>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Rent: ₱5,000 / month • Water: ₱500 / month
            </p>
          </div>
          <p className="text-[11px] text-slate-400 mt-4 border-t border-slate-100 pt-2">
            Lease expires: January 15, 2027
          </p>
        </Card>

        {/* Utility Consumption */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Electricity Usage
              </span>
              <Zap className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-3xl font-black text-slate-900 mt-2">85 kWh</p>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Latest reading: 1,285 kWh (₱15.00/kWh)
            </p>
          </div>
          <p className="text-[11px] text-slate-400 mt-4 border-t border-slate-100 pt-2">
            Estimated electric charge: ₱1,275.00
          </p>
        </Card>
      </div>

      {/* Quick Access Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
              <Wrench className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Need something fixed?</h3>
              <p className="text-xs text-slate-500">Submit a repair request to building maintenance</p>
            </div>
          </div>
          <Link to="/tenant/maintenance">
            <Button size="sm">
              Request Repair <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </Card>

        <Card className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-sky-50 rounded-2xl text-sky-600">
              <Receipt className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Pay via GCash</h3>
              <p className="text-xs text-slate-500">View official QR code and submit payment receipt</p>
            </div>
          </div>
          <Link to="/tenant/billing">
            <Button variant="secondary" size="sm">
              Pay Online <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
