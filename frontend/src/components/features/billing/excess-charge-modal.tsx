import { useState, useEffect } from "react";
import { PlusCircle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { excessChargesService } from "@/lib/services/excess-charges";
import type { Tenant } from "@/lib/types";

interface ExcessChargeModalProps {
  open: boolean;
  onClose: () => void;
  tenants: Tenant[];
  onSuccess: () => void;
}

export function ExcessChargeModal({ open, onClose, tenants, onSuccess }: ExcessChargeModalProps) {
  const [tenantId, setTenantId] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [chargeDate, setChargeDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (tenants.length > 0 && (!tenantId || !tenants.some((t) => String(t.id) === String(tenantId)))) {
        setTenantId(String(tenants[0].id));
      }
      setError(null);
    }
  }, [open, tenants, tenantId]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setAmount("");
    setChargeDate(new Date().toISOString().split("T")[0]);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const selectedTenant = tenantId || (tenants[0] ? String(tenants[0].id) : "");
    if (!selectedTenant) {
      setError("Please select an active tenant.");
      return;
    }

    if (!title.trim()) {
      setError("Please provide a title for the charge.");
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount greater than zero.");
      return;
    }

    setLoading(true);
    try {
      await excessChargesService.createCharge({
        tenant_id: selectedTenant,
        title: title.trim(),
        description: description.trim() || undefined,
        amount: numAmount,
        charge_date: chargeDate,
      });

      resetForm();
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create incidental charge.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title="Add Tenant Incidental Charge"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => {
              resetForm();
              onClose();
            }}
            disabled={loading}
          >
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
          Incidental charges (repairs, aircon cleaning, key replacements, etc.) will automatically be itemized and added to the tenant's next generated monthly invoice.
        </p>

        {error && (
          <div className="rounded-lg bg-danger/10 border border-danger/30 p-2.5 text-xs text-danger-fg font-medium">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="charge-tenant-select" className="text-xs font-semibold text-fg">
            Tenant & Room
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
