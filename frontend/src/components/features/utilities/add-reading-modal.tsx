import { useState, useEffect } from "react";
import { Zap, AlertCircle, Camera, Check } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { utilitiesService } from "@/lib/services/utilities";
import { formatCurrency, formatLocalDateString } from "@/lib/formatters";
import { getErrorMessage } from "@/lib/errors";
import type { Tenant, Property } from "@/lib/types";

interface AddReadingModalProps {
  open: boolean;
  onClose: () => void;
  tenants: Tenant[];
  properties: Property[];
  elecRate: number;
  getLatestReading: (tenantId: string) => number;
  onSuccess: () => void;
}

export function AddReadingModal({
  open,
  onClose,
  tenants,
  properties,
  elecRate,
  getLatestReading,
  onSuccess,
}: AddReadingModalProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("all");
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [prevReading, setPrevReading] = useState<number>(0);
  const [currReading, setCurrReading] = useState<number | "">("");
  const [readingDate, setReadingDate] = useState<string>(formatLocalDateString());
  const [customRate, setCustomRate] = useState<number>(elecRate);
  const [meterPhoto, setMeterPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Sync customRate when elecRate prop updates
  useEffect(() => {
    setCustomRate(elecRate);
  }, [elecRate]);

  // Filter tenants by property if property filter is selected
  const availableTenants = tenants.filter((t) => {
    if (selectedPropertyId === "all") return true;
    return String(t.property_id) === String(selectedPropertyId);
  });

  // When modal opens or property changes, set initial tenant
  useEffect(() => {
    if (open && availableTenants.length > 0) {
      if (!selectedTenantId || !availableTenants.some((t) => t.id === selectedTenantId)) {
        const first = availableTenants[0];
        setSelectedTenantId(first.id);
        const lastReading = getLatestReading(first.id);
        setPrevReading(lastReading);
        setCurrReading("");
      }
    }
  }, [open, selectedPropertyId, availableTenants, selectedTenantId, getLatestReading]);

  // Reset photo on modal close/open
  useEffect(() => {
    if (!open) {
      setMeterPhoto(null);
      setFormError(null);
    }
  }, [open]);

  // When selected tenant changes, fetch previous reading automatically
  const handleTenantChange = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    const last = getLatestReading(tenantId);
    setPrevReading(last);
    setCurrReading("");
    setFormError(null);
  };

  const currentNumber = typeof currReading === "number" ? currReading : 0;
  const usage = Math.max(0, currentNumber - prevReading);
  const totalAmount = usage * customRate;
  const isInvalidReading = currentNumber > 0 && currentNumber < prevReading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedTenantId) {
      setFormError("Please select a tenant.");
      return;
    }

    if (currReading === "" || isNaN(Number(currReading))) {
      setFormError("Please enter a valid current meter reading.");
      return;
    }

    if (currentNumber < prevReading) {
      setFormError("Current reading cannot be lower than the previous reading.");
      return;
    }

    setLoading(true);
    try {
      await utilitiesService.createReading({
        tenant_id: selectedTenantId,
        prev_reading: prevReading,
        curr_reading: currentNumber,
        date: readingDate,
        meter_photo: meterPhoto,
      });

      setMeterPhoto(null);
      onSuccess();
      onClose();
    } catch (err) {
      setFormError(getErrorMessage(err, "Failed to record meter reading."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Record Electric Meter Reading" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="flex items-center gap-2 p-3 text-xs font-semibold rounded-lg bg-danger-bg text-danger-fg border border-danger-border">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Property & Tenant Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-fg-soft mb-1.5">
              Property (Filter)
            </label>
            <Select
              value={selectedPropertyId}
              onChange={(e) => {
                setSelectedPropertyId(e.target.value);
                setSelectedTenantId("");
              }}
            >
              <option value="all">All Properties</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-fg-soft mb-1.5">
              Select Tenant & Unit <span className="text-danger">*</span>
            </label>
            <Select
              value={selectedTenantId}
              onChange={(e) => handleTenantChange(e.target.value)}
              required
            >
              {availableTenants.length === 0 ? (
                <option value="" disabled>
                  No active tenants found
                </option>
              ) : (
                availableTenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.room ? `(${t.room})` : ""}
                  </option>
                ))
              )}
            </Select>
          </div>
        </div>

        {/* Date Row */}
        <div>
          <label className="block text-xs font-semibold text-fg-soft mb-1.5">
            Reading Date <span className="text-danger">*</span>
          </label>
          <Input
            type="date"
            value={readingDate}
            onChange={(e) => setReadingDate(e.target.value)}
            required
          />
        </div>

        {/* Meter Readings Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-fg-soft mb-1.5">
              Previous Reading (kWh)
            </label>
            <Input
              type="number"
              step="any"
              min="0"
              value={prevReading}
              onChange={(e) => setPrevReading(parseFloat(e.target.value) || 0)}
              required
            />
            <p className="mt-1 text-[11px] text-muted">
              Auto-filled from previous record.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-fg-soft mb-1.5">
              Current Reading (kWh) <span className="text-danger">*</span>
            </label>
            <Input
              type="number"
              step="any"
              min={prevReading}
              placeholder="e.g. 3720"
              value={currReading}
              onChange={(e) =>
                setCurrReading(e.target.value === "" ? "" : parseFloat(e.target.value))
              }
              required
              autoFocus
            />
            {isInvalidReading && (
              <p className="mt-1 text-[11px] text-danger-fg">
                Current reading must be ≥ previous ({prevReading})
              </p>
            )}
          </div>
        </div>

        {/* Calculation Preview Box */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary">
            <Zap className="h-4 w-4" />
            <span>Automatic Calculation</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-primary/10">
            <div>
              <p className="text-[11px] text-muted">Usage</p>
              <p className="text-base font-bold text-fg mt-0.5">
                {usage.toFixed(1)}{" "}
                <span className="text-xs font-normal text-muted">kWh</span>
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted">Rate Applied</p>
              <p className="text-base font-bold text-fg mt-0.5">
                ₱{customRate.toFixed(2)}{" "}
                <span className="text-xs font-normal text-muted">/kWh</span>
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted">Total Cost</p>
              <p className="text-base font-bold text-primary mt-0.5">
                {formatCurrency(totalAmount)}
              </p>
            </div>
          </div>
        </div>

        {/* Meter Photo Proof */}
        <div>
          <label className="block text-xs font-semibold text-fg-soft mb-1.5">
            Meter Photo Proof
          </label>
          <label
            htmlFor="meter-photo-input"
            className="flex items-center justify-between cursor-pointer rounded-xl border border-dashed border-border p-3 transition-colors hover:border-primary hover:bg-subtle/50"
          >
            <input
              id="meter-photo-input"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                if (file && file.size > 10 * 1024 * 1024) {
                  setFormError("Selected photo exceeds 10MB limit.");
                  return;
                }
                setFormError(null);
                setMeterPhoto(file);
              }}
            />
            <div className="flex items-center gap-3">
              {meterPhoto ? (
                <div className="relative h-12 w-12 rounded-lg overflow-hidden border border-border shrink-0 bg-subtle">
                  <img
                    src={URL.createObjectURL(meterPhoto)}
                    alt="Meter preview"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                  <Camera className="h-5 w-5" />
                </div>
              )}

              <div>
                {meterPhoto ? (
                  <p className="text-xs font-semibold text-fg truncate max-w-[200px]">
                    {meterPhoto.name}
                  </p>
                ) : (
                  <p className="text-xs font-semibold text-fg">
                    Take Photo or Upload Image
                  </p>
                )}
                <p className="text-[11px] text-muted mt-0.5">
                  {meterPhoto
                    ? `${(meterPhoto.size / 1024).toFixed(0)} KB • Click to retake or change`
                    : "Snap a photo with camera or select from files"}
                </p>
              </div>
            </div>

            {meterPhoto && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-danger-fg hover:bg-danger-bg h-7 px-2"
                onClick={(e) => {
                  e.preventDefault();
                  setMeterPhoto(null);
                }}
              >
                Remove
              </Button>
            )}
          </label>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-border">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading || isInvalidReading}>
            {loading ? "Recording..." : "Save & Post Reading"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
