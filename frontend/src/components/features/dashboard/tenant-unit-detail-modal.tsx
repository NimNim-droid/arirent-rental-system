import {
  Home,
  Building2,
  Droplet,
  Calendar,
  CreditCard,
  BadgeCheck,
  Phone,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { TenantDashboardData } from "@/lib/types";

interface TenantUnitDetailModalProps {
  open: boolean;
  onClose: () => void;
  unit: TenantDashboardData["unit"] | undefined;
}

function calculateDaysLeft(dateString?: string | null): number | null {
  if (!dateString) return null;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let target: Date;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split("-").map(Number);
      target = new Date(year, month - 1, day);
    } else {
      target = new Date(dateString);
    }
    target.setHours(0, 0, 0, 0);

    const diff = target.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

export function TenantUnitDetailModal({
  open,
  onClose,
  unit,
}: TenantUnitDetailModalProps) {
  const daysRemaining = calculateDaysLeft(unit?.lease_end);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Unit Details & Tenancy Terms"
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Header Block: Property, Room, Address */}
        <div className="rounded-2xl border border-edge bg-inset p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                Assigned Unit
              </span>
              <h3 className="text-base font-extrabold text-fg truncate">
                {unit ? (
                  <>
                    {unit.property_name}
                    <span className="mx-1.5 text-muted/50">|</span>
                    Room {unit.room}
                  </>
                ) : (
                  "Unassigned Unit"
                )}
              </h3>
              {unit?.address && (
                <p className="text-xs text-muted truncate">
                  {unit.address}
                  {unit.city ? ` · ${unit.city}` : ""}
                </p>
              )}
            </div>

            <Badge
              variant="success"
              className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0"
            >
              <BadgeCheck className="h-3 w-3 mr-1" />
              Active Lease
            </Badge>
          </div>
        </div>

        {/* 2x2 Grid: Key Tenancy Terms */}
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div className="rounded-2xl border border-edge bg-card p-3 space-y-1 shadow-card">
            <span className="text-[11px] font-semibold text-muted flex items-center gap-1">
              <Home className="h-3.5 w-3.5 text-accent" />
              Monthly Rent
            </span>
            <p className="text-sm font-extrabold text-fg tabular-nums">
              {unit ? formatCurrency(unit.rent) : "—"}
              <span className="text-[10px] font-normal text-muted">/mo</span>
            </p>
          </div>

          <div className="rounded-2xl border border-edge bg-card p-3 space-y-1 shadow-card">
            <span className="text-[11px] font-semibold text-muted flex items-center gap-1">
              <Droplet className="h-3.5 w-3.5 text-info-fg" />
              Water Service
            </span>
            <p className="text-sm font-extrabold text-fg tabular-nums">
              {unit ? formatCurrency(unit.water_rate) : "—"}
              <span className="text-[10px] font-normal text-muted">/mo (Flat)</span>
            </p>
          </div>

          <div className="rounded-2xl border border-edge bg-card p-3 space-y-1 shadow-card">
            <span className="text-[11px] font-semibold text-muted flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-warning-fg" />
              Lease Contract
            </span>
            <p className="text-xs font-bold text-fg truncate">
              {unit?.lease_end ? formatDate(unit.lease_end) : "Standard Lease"}
            </p>
            {daysRemaining !== null && (
              <p className="text-[10px] font-semibold text-accent">
                {daysRemaining > 0
                  ? `${daysRemaining} days remaining`
                  : "Lease term completed"}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-edge bg-card p-3 space-y-1 shadow-card">
            <span className="text-[11px] font-semibold text-muted flex items-center gap-1">
              <CreditCard className="h-3.5 w-3.5 text-success-fg" />
              Payment Method
            </span>
            <p className="text-xs font-bold text-fg">GCash Settlement</p>
            <p className="text-[10px] text-muted">Official QR / Ref</p>
          </div>
        </div>

        {/* 24/7 Hotline callout */}
        <div className="flex items-center justify-between rounded-2xl border border-[#fedf89] bg-[#fffaeb] dark:border-[#78350f] dark:bg-[#451a03]/40 p-3 text-xs shadow-soft">
          <div className="flex items-center gap-2.5 min-w-0">
            <Phone className="h-4 w-4 text-[#b45309] shrink-0" />
            <div className="min-w-0">
              <p className="font-bold text-fg">Emergency Hotline (24/7)</p>
              <p className="text-[11px] font-semibold text-warning-fg">0917-222-3333</p>
            </div>
          </div>
          <a
            href="tel:09172223333"
            className="shrink-0 rounded-xl bg-[#fef08a] dark:bg-[#78350f] px-3 py-1 text-xs font-bold text-[#b45309] dark:text-[#fef08a]"
          >
            Call
          </a>
        </div>

        <div className="flex justify-end pt-2 border-t border-edge">
          <Button type="button" onClick={onClose} size="sm">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
