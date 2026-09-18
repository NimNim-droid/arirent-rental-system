import { Link } from "react-router";
import { Home, Zap, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SkeletonRows } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/formatters";
import type { TenantDashboardData } from "@/lib/types";

interface TenantUnitCardProps {
  unit: TenantDashboardData["unit"] | undefined;
  elec: TenantDashboardData["electricity"] | undefined;
  loading: boolean;
}

export function TenantUnitCard({ unit, elec, loading }: TenantUnitCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* Unit & Lease Details */}
      <Card className="p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-fg flex items-center gap-2">
              <Home className="h-4 w-4 text-accent" />
              My Unit & Lease
            </h2>
            {unit && <Badge variant="neutral">Active Lease</Badge>}
          </div>

          {loading ? (
            <div className="mt-4">
              <SkeletonRows rows={4} />
            </div>
          ) : (
            <div className="mt-4 space-y-3 animate-fade-in">
              <div className="flex items-baseline justify-between border-b border-edge pb-2.5">
                <span className="text-xs text-muted">Assigned Room</span>
                <span className="text-base font-bold text-fg">
                  {unit ? `Room ${unit.room}` : "Unassigned"}
                </span>
              </div>
              <div className="flex items-baseline justify-between border-b border-edge pb-2.5">
                <span className="text-xs text-muted">Property Location</span>
                <span className="text-xs font-semibold text-fg-soft">
                  {unit?.property_name ?? "—"}
                </span>
              </div>
              <div className="flex items-baseline justify-between border-b border-edge pb-2.5">
                <span className="text-xs text-muted">Monthly Rent</span>
                <span className="text-xs font-bold text-fg tabular-nums">
                  {unit ? `${formatCurrency(unit.rent)}/mo` : "—"}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted">Water Rate</span>
                <span className="text-xs font-semibold text-fg tabular-nums">
                  {unit ? `${formatCurrency(unit.water_rate)}/mo (Flat)` : "—"}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 pt-3 border-t border-edge flex items-center justify-between text-xs">
          <span className="text-muted">
            {unit?.lease_end
              ? `Lease term until ${unit.lease_end}`
              : "Standard lease terms apply"}
          </span>
          <Link
            to="/tenant/documents"
            className="font-semibold text-accent hover:text-accent-strong inline-flex items-center gap-1"
          >
            <FileText className="h-3.5 w-3.5" /> View Agreement
          </Link>
        </div>
      </Card>

      {/* Electricity Consumption */}
      <Card className="p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-fg flex items-center gap-2">
              <Zap className="h-4 w-4 text-warning-fg" />
              Electricity Consumption
            </h2>
            <Badge variant="neutral">Monthly Reading</Badge>
          </div>

          {loading ? (
            <div className="mt-4">
              <SkeletonRows rows={4} />
            </div>
          ) : elec ? (
            <div className="mt-4 space-y-3 animate-fade-in">
              <div className="flex items-baseline justify-between border-b border-edge pb-2.5">
                <span className="text-xs text-muted">
                  Consumption this Cycle
                </span>
                <span className="text-base font-bold text-fg tabular-nums">
                  {elec.usage_kwh} kWh
                </span>
              </div>
              <div className="flex items-baseline justify-between border-b border-edge pb-2.5">
                <span className="text-xs text-muted">Electricity Rate</span>
                <span className="text-xs font-semibold text-fg-soft tabular-nums">
                  ₱{elec.elec_rate}/kWh
                </span>
              </div>
              <div className="flex items-baseline justify-between border-b border-edge pb-2.5">
                <span className="text-xs text-muted">Estimated Charge</span>
                <span className="text-xs font-bold text-accent tabular-nums">
                  {formatCurrency(elec.estimated_charge)}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted">Last Reading Date</span>
                <span className="text-xs text-muted">
                  {elec.last_reading_date ?? "Pending this cycle"}
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-4 text-xs text-muted">
              No electricity readings recorded yet for your unit.
            </div>
          )}
        </div>

        <div className="mt-5 pt-3 border-t border-edge flex items-center justify-between text-xs text-muted">
          <span>Readings are recorded monthly by property staff</span>
          <Link
            to="/tenant/billing"
            className="font-semibold text-accent hover:text-accent-strong"
          >
            Billing details &rarr;
          </Link>
        </div>
      </Card>
    </div>
  );
}
