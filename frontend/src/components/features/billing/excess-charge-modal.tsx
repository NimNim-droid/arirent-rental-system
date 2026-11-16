import { PlusCircle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Tenant } from "@/lib/types";
import { useExcessChargeForm } from "./hooks/useExcessChargeForm";

interface ExcessChargeModalProps {
  open: boolean;
  onClose: () => void;
  tenants: Tenant[];
  onSuccess: () => void;
}

export function ExcessChargeModal({ open, onClose, tenants, onSuccess }: ExcessChargeModalProps) {
  const {
    tenantId,
    setTenantId,
    title,
    setTitle,
    description,
    setDescription,
    amount,
    setAmount,
    chargeDate,
    setChargeDate,
    loading,
    error,
    handleClose,
    handleSubmit,
  } = useExcessChargeForm({ open, tenants, onClose, onSuccess });

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add Tenant Incidental Charge"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button id="charge-submit-button" onClick={handleSubmit} loading={loading}>
            <PlusCircle className="h-4 w-4" /> Save Charge
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <p className="text-xs text-muted">
          Incidental charges (repairs, aircon cleaning, key replacements, etc.) will automatically be
          itemized and added to the tenant&apos;s next generated monthly invoice.
        </p>

        {error && (
          <div className="rounded-lg bg-danger/10 border border-danger/30 p-2.5 text-xs text-danger-fg font-medium">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="charge-tenant-select" className="text-xs font-semibold text-fg">
            Tenant &amp; Room
          </label>
          <Select
            id="charge-tenant-select"
            value={tenantId || (tenants[0] ? String(tenants[0].id) : "")}
            onChange={(e) => setTenantId(e.target.value)}
          >
            {tenants.map((t) => (
              <option key={t.id} value={String(t.id)}>
                {t.name} (Room {t.room})
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="charge-title-input" className="text-xs font-semibold text-fg">
            Charge Title *
          </label>
          <Input
            id="charge-title-input"
            type="text"
            placeholder="e.g. Lost Key Replacement, Aircon Cleaning, Extra Appliance"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="charge-amount-input" className="text-xs font-semibold text-fg">
              Amount (₱) *
            </label>
            <Input
              id="charge-amount-input"
              type="number"
              step="0.01"
              min="1"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="charge-date-input" className="text-xs font-semibold text-fg">
              Charge Date *
            </label>
            <Input
              id="charge-date-input"
              type="date"
              value={chargeDate}
              onChange={(e) => setChargeDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="charge-description-input" className="text-xs font-semibold text-fg">
            Description / Item Details (Will appear on invoice)
          </label>
          <Input
            id="charge-description-input"
            type="text"
            placeholder="e.g. Inverter AC deep chemical wash and filter sanitization"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}
