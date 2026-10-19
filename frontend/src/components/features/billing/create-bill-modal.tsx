import { Zap, Calendar, Home, ChevronDown } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { AlertBanner } from "@/components/ui/alert-banner";
import { formatCurrency } from "@/lib/formatters";
import type { Tenant } from "@/lib/types";
import { useCreateBillForm } from "./hooks/useCreateBillForm";
import { SubMeterCalculator } from "./sub-meter-calculator";
import { BillStatementSummary } from "./bill-statement-summary";

interface CreateBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  tenants: Tenant[];
  initialTenantId?: string;
}

export function CreateBillModal({
  isOpen,
  onClose,
  onSuccess,
  tenants,
  initialTenantId,
}: CreateBillModalProps) {
  const {
    activeTenants,
    selectedTenant,
    selectedTenantId,
    setSelectedTenantId,
    rent,
    setRent,
    elecUsage,
    setElecUsage,
    elecRate,
    setElecRate,
    water,
    setWater,
    lateFee,
    dueDate,
    setDueDate,
    billingDate,
    setBillingDate,
    notes,
    setNotes,
    showMeterCalc,
    setShowMeterCalc,
    prevReading,
    currReading,
    handleMeterCalcChange,
    parsedUsage,
    electricityAmount,
    totalAmount,
    loading,
    error,
    handleSubmit,
  } = useCreateBillForm({
    tenants,
    initialTenantId,
    isOpen,
    onSuccess,
    onClose,
  });

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Create Individual Bill"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-3 text-sm">
        {error && <AlertBanner variant="danger" message={error} />}

        {/* 1. Resident Selection & Context */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-fg-soft">Resident & Room</label>
            {selectedTenant && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent">
                <Calendar className="h-3 w-3" />
                Due: Day {selectedTenant.billing_day || 1} of month
              </span>
            )}
          </div>
          <div className="relative">
            <select
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              disabled={loading || Boolean(initialTenantId)}
              className="w-full cursor-pointer appearance-none rounded-xl border border-edge bg-inset px-3 py-2 pr-10 text-xs sm:text-sm font-medium text-fg shadow-2xs transition-all duration-150 hover:border-edge-strong focus:border-accent focus:bg-card focus:outline-none focus:ring-3 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {activeTenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} — Room {t.room} ({t.property_name})
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          </div>

          {selectedTenant && (
            <div className="flex items-center gap-1.5 pl-0.5 pt-0.5 text-[11px] text-muted">
              <Home className="h-3 w-3 shrink-0 text-accent" />
              <span>{selectedTenant.property_name} • Room {selectedTenant.room}</span>
              <span className="text-edge-strong">•</span>
              <span>Base Rent: {formatCurrency(selectedTenant.room_rent)}</span>
            </div>
          )}
        </div>

        {/* 2. Room Rent & Water Charges */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="mb-1 block text-xs font-semibold text-fg-soft">
              Room Rent
            </label>
            <div className="relative flex items-center rounded-xl border border-edge bg-inset transition-all duration-150 focus-within:border-accent focus-within:bg-card focus-within:ring-3 focus-within:ring-accent/15">
              <span className="select-none pl-3 text-xs font-bold text-muted">₱</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={rent || ""}
                onChange={(e) => setRent(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full bg-transparent py-1.5 pl-1.5 pr-3 text-xs sm:text-sm font-semibold tabular-nums text-fg placeholder:text-faint focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-fg-soft">
              Water Utility
            </label>
            <div className="relative flex items-center rounded-xl border border-edge bg-inset transition-all duration-150 focus-within:border-accent focus-within:bg-card focus-within:ring-3 focus-within:ring-accent/15">
              <span className="select-none pl-3 text-xs font-bold text-muted">₱</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={water || ""}
                onChange={(e) => setWater(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full bg-transparent py-1.5 pl-1.5 pr-3 text-xs sm:text-sm font-semibold tabular-nums text-fg placeholder:text-faint focus:outline-none"
                required
              />
            </div>
          </div>
        </div>

        {/* 3. Electricity Consumption Section */}
        <div className="space-y-2.5 rounded-xl border border-edge bg-card/60 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-fg-soft">
              <Zap className="h-3.5 w-3.5 fill-amber-500/20 text-amber-500" />
              <span>Electricity Consumption</span>
            </div>
            <SubMeterCalculator
              showMeterCalc={showMeterCalc}
              onToggle={() => setShowMeterCalc(!showMeterCalc)}
              selectedTenant={selectedTenant}
              prevReading={prevReading}
              currReading={currReading}
              onReadingChange={handleMeterCalcChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-fg-soft">
                kWh Consumed
              </label>
              <div className="relative flex items-center rounded-xl border border-edge bg-inset transition-all duration-150 focus-within:border-accent focus-within:bg-card focus-within:ring-3 focus-within:ring-accent/15">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="e.g. 45"
                  value={elecUsage}
                  onChange={(e) => setElecUsage(e.target.value)}
                  className="w-full bg-transparent py-1.5 pl-3 pr-11 text-xs sm:text-sm font-bold tabular-nums text-fg placeholder:text-faint focus:outline-none"
                />
                <span className="pointer-events-none absolute right-2.5 text-[11px] font-semibold text-muted">
                  kWh
                </span>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-fg-soft">
                Rate per kWh
              </label>
              <div className="relative flex items-center rounded-xl border border-edge bg-inset transition-all duration-150 focus-within:border-accent focus-within:bg-card focus-within:ring-3 focus-within:ring-accent/15">
                <span className="select-none pl-2.5 text-xs font-bold text-muted">₱</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={elecRate}
                  onChange={(e) => setElecRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent py-1.5 pl-1 pr-12 text-xs sm:text-sm font-semibold tabular-nums text-fg focus:outline-none"
                />
                <span className="pointer-events-none absolute right-2 text-[10px] font-semibold text-muted">
                  /kWh
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-edge/60 pt-1 text-xs">
            <span className="text-[11px] text-muted">Calculated Electricity:</span>
            <div className="flex items-baseline gap-1.5 font-bold tabular-nums text-fg">
              <span className="text-xs sm:text-sm">{formatCurrency(electricityAmount)}</span>
              {parsedUsage > 0 && (
                <span className="text-[10px] font-normal text-muted">
                  ({parsedUsage} kWh × ₱{elecRate})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 4. Dates & Coverage Notes */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="mb-1 block text-xs font-semibold text-fg-soft">
              Rent Due Date
            </label>
            <div className="relative flex items-center rounded-xl border border-edge bg-inset transition-all focus-within:border-accent focus-within:bg-card focus-within:ring-3 focus-within:ring-accent/15">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-transparent px-3 py-1.5 text-xs font-semibold text-fg focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-fg-soft">
              Invoice Issue Date
            </label>
            <div className="relative flex items-center rounded-xl border border-edge bg-inset transition-all focus-within:border-accent focus-within:bg-card focus-within:ring-3 focus-within:ring-accent/15">
              <input
                type="date"
                value={billingDate}
                onChange={(e) => setBillingDate(e.target.value)}
                className="w-full bg-transparent px-3 py-1.5 text-xs font-semibold text-fg focus:outline-none"
                required
              />
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-fg-soft">
            Billing Period / Coverage Notes
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Monthly rent (Coverage: Oct 18, 2026 - Nov 17, 2026)"
            className="w-full rounded-xl border border-edge bg-inset px-3 py-1.5 text-xs text-fg placeholder:text-faint transition-all duration-150 focus:border-accent focus:bg-card focus:outline-none focus:ring-3 focus:ring-accent/15"
          />
        </div>

        {/* 5. Statement Summary Card */}
        <BillStatementSummary
          rent={rent}
          electricityAmount={electricityAmount}
          parsedUsage={parsedUsage}
          water={water}
          lateFee={lateFee}
          totalAmount={totalAmount}
          dueDate={dueDate}
        />

        {/* 6. Form Actions */}
        <div className="flex items-center justify-end gap-2 pt-0.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            loading={loading}
            className="px-4 shadow-xs"
          >
            Create & Issue Bill
          </Button>
        </div>
      </form>
    </Modal>
  );
}
