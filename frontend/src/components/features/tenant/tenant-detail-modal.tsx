import { useState } from "react";
import {
  User,
  Building,
  Home,
  Mail,
  Phone,
  Calendar,
  Banknote,
  Droplets,
  LogOut,
  Trash2,
  ShieldAlert,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { Tenant } from "@/lib/types";

interface TenantDetailModalProps {
  tenant: Tenant | null;
  isBusy: boolean;
  error?: string;
  onVacate: (tenant: Tenant) => void;
  onDelete?: (tenant: Tenant) => void;
  onClose: () => void;
}

export function TenantDetailModal({
  tenant,
  isBusy,
  error,
  onVacate,
  onDelete,
  onClose,
}: TenantDetailModalProps) {
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);

  if (!tenant) return null;

  const handleClose = () => {
    setConfirmDelete(false);
    onClose();
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(tenant);
    }
  };

  return (
    <Modal
      open={!!tenant}
      onClose={handleClose}
      title="Tenant Details"
      maxWidth="md"
      footer={
        <div className="flex w-full items-center justify-between">
          <div>
            {onDelete && !confirmDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(true)}
                disabled={isBusy}
                className="text-danger-fg hover:bg-danger/10 text-xs"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Record
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleClose} disabled={isBusy}>
              Close
            </Button>
            {tenant.status === "active" && !confirmDelete && (
              <Button
                variant="danger"
                size="sm"
                loading={isBusy}
                onClick={() => onVacate(tenant)}
              >
                {!isBusy && (
                  <>
                    <LogOut className="h-3.5 w-3.5" />
                    End Lease & Vacate
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-sm">
        {error && (
          <div className="rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-xs text-danger-fg">
            {error}
          </div>
        )}

        {/* Delete Confirmation Warning */}
        {confirmDelete && (
          <div className="rounded-md border border-danger/30 bg-danger/10 p-3.5 space-y-2.5 animate-fade-in text-xs text-danger-fg">
            <div className="flex items-center gap-2 font-bold text-sm">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>Confirm Permanent Deletion</span>
            </div>
            <p className="leading-relaxed">
              Are you sure you want to permanently delete resident <strong>{tenant.name}</strong>? This will release their room assignment and remove their login credentials.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="danger"
                size="sm"
                loading={isBusy}
                onClick={handleDelete}
              >
                Yes, Delete Tenant
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmDelete(false)}
                disabled={isBusy}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Centered User Avatar & Name Header (Matches Screenshot 3) */}
        <div className="flex flex-col items-center justify-center text-center pb-2 pt-1">
          <div className="h-16 w-16 rounded-full bg-accent/15 border-2 border-accent/30 text-accent flex items-center justify-center mb-2 shadow-2xs">
            <User className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold text-fg tracking-tight">{tenant.name}</h3>
          <p className="text-xs text-muted mt-0.5">
            @{tenant.username} • {tenant.property_name || "Resident"}
          </p>
          <div className="mt-2">
            <Badge
              dot
              variant={
                tenant.status === "active"
                  ? "success"
                  : tenant.status === "pending_approval"
                  ? "warning"
                  : "neutral"
              }
            >
              {tenant.status === "active"
                ? "Active Lease"
                : tenant.status === "pending_approval"
                ? "Pending Room Reservation"
                : "Inactive / Vacated"}
            </Badge>
          </div>
        </div>

        {/* Vertical Itemized List with Icons (Matches Screenshot 3) */}
        <div className="rounded-2xl border border-edge bg-inset/50 p-4 divide-y divide-edge/60 space-y-3">
          {/* Email */}
          <div className="flex items-center gap-3 pt-2 first:pt-0">
            <div className="rounded-lg bg-card p-2 text-accent border border-edge shrink-0">
              <Mail className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-muted font-medium">Email Address</p>
              <p className="font-semibold text-fg text-xs truncate">{tenant.email || "—"}</p>
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-center gap-3 pt-3">
            <div className="rounded-lg bg-card p-2 text-accent border border-edge shrink-0">
              <Phone className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-muted font-medium">Phone Number</p>
              <p className="font-semibold text-fg text-xs">{tenant.phone || "—"}</p>
            </div>
          </div>

          {/* Property */}
          <div className="flex items-center gap-3 pt-3">
            <div className="rounded-lg bg-card p-2 text-accent border border-edge shrink-0">
              <Building className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-muted font-medium">Property</p>
              <p className="font-semibold text-fg text-xs">{tenant.property_name || "—"}</p>
            </div>
          </div>

          {/* Room / Unit */}
          <div className="flex items-center gap-3 pt-3">
            <div className="rounded-lg bg-card p-2 text-accent border border-edge shrink-0">
              <Home className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-muted font-medium">Room / Unit</p>
              <p className="font-bold text-fg text-xs">Room {tenant.room}</p>
            </div>
          </div>

          {/* Monthly Rent */}
          {tenant.room_rent !== undefined && tenant.room_rent > 0 && (
            <div className="flex items-center gap-3 pt-3">
              <div className="rounded-lg bg-card p-2 text-accent border border-edge shrink-0">
                <Banknote className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-muted font-medium">Monthly Rent</p>
                <p className="font-bold text-accent text-xs tabular-nums">
                  {formatCurrency(tenant.room_rent)}
                </p>
              </div>
            </div>
          )}

          {/* Move-in Date */}
          <div className="flex items-center gap-3 pt-3">
            <div className="rounded-lg bg-card p-2 text-accent border border-edge shrink-0">
              <Calendar className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-muted font-medium">Move-In Date</p>
              <p className="font-semibold text-fg text-xs">
                {tenant.move_in_date ? formatDate(tenant.move_in_date) : "N/A"}
              </p>
            </div>
          </div>

          {/* Lease Expiration */}
          <div className="flex items-center gap-3 pt-3">
            <div className="rounded-lg bg-card p-2 text-accent border border-edge shrink-0">
              <Calendar className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-muted font-medium">Lease Expiration</p>
              <p className="font-semibold text-fg text-xs">
                {tenant.lease_end ? formatDate(tenant.lease_end) : "Ongoing Lease"}
              </p>
            </div>
          </div>

          {/* Water Rate */}
          <div className="flex items-center gap-3 pt-3">
            <div className="rounded-lg bg-card p-2 text-sky-500 border border-edge shrink-0">
              <Droplets className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-muted font-medium">Monthly Water Utility</p>
              <p className="font-semibold text-fg text-xs tabular-nums">
                {formatCurrency(tenant.water_rate)}/month
              </p>
            </div>
          </div>

          {/* Advance Deposit */}
          {tenant.advance_paid !== undefined && (
            <div className="flex items-center gap-3 pt-3">
              <div className="rounded-lg bg-card p-2 text-emerald-500 border border-edge shrink-0">
                <Banknote className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-muted font-medium">Advance Deposit Paid</p>
                <p className="font-semibold text-fg text-xs tabular-nums">
                  {formatCurrency(tenant.advance_paid)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
