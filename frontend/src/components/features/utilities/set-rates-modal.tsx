import { useState, useEffect } from "react";
import { Settings as SettingsIcon, AlertCircle, Info } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Settings } from "@/lib/types";

interface SetRatesModalProps {
  open: boolean;
  onClose: () => void;
  settings: Settings | null;
  onSave: (updated: Partial<Settings>) => Promise<boolean>;
}

export function SetRatesModal({ open, onClose, settings, onSave }: SetRatesModalProps) {
  const [elecRate, setElecRate] = useState<string>("");
  const [waterRate, setWaterRate] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setElecRate(String(settings.elec_rate ?? 12.5));
      setWaterRate(String(settings.water_rate ?? 200.0));
    }
  }, [settings, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numElec = parseFloat(elecRate);
    const numWater = parseFloat(waterRate);

    if (isNaN(numElec) || numElec <= 0) {
      setError("Please enter a valid electricity rate (greater than 0).");
      return;
    }

    if (isNaN(numWater) || numWater < 0) {
      setError("Please enter a valid water rate (0 or greater).");
      return;
    }

    setSaving(true);
    const success = await onSave({
      elec_rate: numElec,
      water_rate: numWater,
    });
    setSaving(false);

    if (success) {
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Configure Utility Rates" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-center gap-2 p-3 text-xs font-semibold rounded-lg bg-danger-bg text-danger-fg border border-danger-border">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="rounded-xl border border-border bg-subtle p-3.5 flex items-start gap-3">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted leading-relaxed">
            Changing these rates will automatically apply to all <strong>future</strong> readings and monthly bills. 
            Past bills and historical records are securely locked and will <strong>not</strong> change.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-fg-soft mb-1.5">
              Default Electricity Rate (₱ / kWh)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted">
                ₱
              </span>
              <Input
                type="number"
                step="0.01"
                min="0"
                className="pl-7"
                placeholder="12.50"
                value={elecRate}
                onChange={(e) => setElecRate(e.target.value)}
                required
              />
            </div>
            <p className="mt-1 text-[11px] text-muted">
              Used when calculating meter usage.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-fg-soft mb-1.5">
              Default Water Rate (₱ / month)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted">
                ₱
              </span>
              <Input
                type="number"
                step="0.01"
                min="0"
                className="pl-7"
                placeholder="200.00"
                value={waterRate}
                onChange={(e) => setWaterRate(e.target.value)}
                required
              />
            </div>
            <p className="mt-1 text-[11px] text-muted">
              Fixed flat monthly charge per active unit.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-border">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Saving..." : "Save Rates"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
