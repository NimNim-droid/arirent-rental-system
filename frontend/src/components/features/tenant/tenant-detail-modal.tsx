import { LogOut } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { TenantAvatar } from "./tenant-avatar";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { Tenant } from "@/lib/types";

interface TenantDetailModalProps {
  tenant: Tenant | null;
  isBusy: boolean;
  error?: string;
  onVacate: (tenant: Tenant) => void;
  onClose: () => void;
}

export function TenantDetailModal({
  tenant,
  isBusy,
  error,
  onVacate,
  onClose,
}: TenantDetailModalProps) {
  if (!tenant) return null;

  return (
    <Modal
      open={!!tenant}
      onClose={onClose}
      title={`Resident Profile: ${tenant.name}`}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="danger"
            size="sm"
            loading={isBusy}
            onClick={() => onVacate(tenant)}
          >
            {!isBusy && (
              <>
                <LogOut className="h-4 w-4" />
                End Lease / Vacate Unit
              </>
            )}
          </Button>
        </>
      }
    >
      {error && (
        <div className="mb-4 rounded-xl border border-danger-border bg-danger-bg px-3 py-2 text-xs font-semibold text-danger-fg">
          {error}
        </div>
      )}
      <div className="flex items-center gap-3 pb-4">
        <TenantAvatar name={tenant.name} className="h-12 w-12 text-sm" />
        <div>
          <p className="font-bold text-fg">{tenant.name}</p>
          <p className="text-xs text-muted">{tenant.email}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 rounded-xl bg-inset p-4 text-sm">
        <div>
          <p className="text-xs text-muted">Assigned Unit</p>
          <p className="font-bold text-fg">Room {tenant.room}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Property</p>
          <p className="font-bold text-fg">{tenant.property_name}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Move-in Date</p>
          <p className="font-bold text-fg">{tenant.move_in_date ? formatDate(tenant.move_in_date) : "N/A"}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Rent Due Day</p>
          <p className="font-bold text-accent">Every {tenant.billing_day || 1}th of month</p>
        </div>
        <div>
          <p className="text-xs text-muted">Advance Paid</p>
          <p className="font-bold text-fg">{formatCurrency(tenant.advance_paid || 0)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Monthly Water Rate</p>
          <p className="font-bold text-fg">{formatCurrency(tenant.water_rate)}</p>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-muted">Lease Expiration</p>
          <p className="font-bold text-fg">{formatDate(tenant.lease_end)}</p>
        </div>
      </div>
    </Modal>
  );
}
