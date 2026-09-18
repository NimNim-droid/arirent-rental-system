import { useState, useEffect, useMemo, type FormEvent } from "react";
import { Zap, Calendar, Home, AlertCircle, Calculator, ChevronDown, ChevronUp } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/formatters";
import { billingService } from "@/lib/services/billing";
import { getErrorMessage } from "@/lib/errors";
import type { Tenant } from "@/lib/types";

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
  const activeTenants = useMemo(() => tenants.filter((t) => t.status === "active"), [tenants]);

  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [rent, setRent] = useState<number>(0);
  const [elecUsage, setElecUsage] = useState<string>("");
  const [elecRate, setElecRate] = useState<number>(12.5);
  const [water, setWater] = useState<number>(500);
  const [lateFee, setLateFee] = useState<number>(0);
  const [dueDate, setDueDate] = useState<string>("");
  const [billingDate, setBillingDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState<string>("");

  // Optional Sub-meter calculator toggle
  const [showMeterCalc, setShowMeterCalc] = useState<boolean>(false);
  const [prevReading, setPrevReading] = useState<string>("");
  const [currReading, setCurrReading] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Select active tenant
  const selectedTenant = useMemo(
    () => activeTenants.find((t) => String(t.id) === String(selectedTenantId)),
    [activeTenants, selectedTenantId]
  );

  // Initialize tenant when modal opens or initialTenantId changes
  useEffect(() => {
    if (isOpen) {
      const targetId = initialTenantId || (activeTenants[0]?.id ? String(activeTenants[0].id) : "");
      setSelectedTenantId(targetId);
      setError("");
      setShowMeterCalc(false);
      setElecUsage("");
      setPrevReading("");
      setCurrReading("");
    }
  }, [isOpen, initialTenantId, activeTenants]);

  // When selected tenant changes, auto-populate rent, water, due date, and coverage notes
  useEffect(() => {
    if (!selectedTenant) return;

    // Room rent
    const roomRent = selectedTenant.room_rent ?? 0;
    setRent(roomRent);

    // Water rate
    const tenantWater = selectedTenant.water_rate > 0 ? selectedTenant.water_rate : 500;
    setWater(tenantWater);

    // Calculate anniversary due date
    const now = new Date();
    const billingDay = selectedTenant.billing_day || 1;
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed

    // If today is past the anniversary day by more than 5 days, target next month
    let targetYear = year;
    let targetMonth = month;
    if (now.getDate() > billingDay + 5) {
      targetMonth += 1;
      if (targetMonth > 11) {
        targetMonth = 0;
        targetYear += 1;
      }
    }

    // Days in target month
    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    const safeDay = Math.min(billingDay, daysInMonth);
    const calculatedDueDate = new Date(targetYear, targetMonth, safeDay);
    const formattedDue = calculatedDueDate.toISOString().split("T")[0];
    setDueDate(formattedDue);

    // Coverage period notes
    const coverageEnd = new Date(targetYear, targetMonth + 1, safeDay - 1);
    const startStr = calculatedDueDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const endStr = coverageEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    setNotes(`Monthly rent (Coverage: ${startStr} - ${endStr})`);

    // Latest meter reading prefill
    if (selectedTenant.latest_reading !== undefined && selectedTenant.latest_reading > 0) {
      setPrevReading(String(selectedTenant.latest_reading));
    } else {
      setPrevReading("0");
    }
  }, [selectedTenant]);

  // Handle meter calculation if landlord enters prev and curr
  const handleMeterCalcChange = (prevStr: string, currStr: string) => {
    setPrevReading(prevStr);
    setCurrReading(currStr);
    const p = parseFloat(prevStr) || 0;
    const c = parseFloat(currStr) || 0;
    if (c >= p) {
      setElecUsage((c - p).toFixed(1));
    }
  };

  // Live electricity cost calculation
  const parsedUsage = parseFloat(elecUsage) || 0;
  const electricityAmount = Math.max(0, parsedUsage * elecRate);

  // Live total calculation
  const totalAmount = rent + electricityAmount + water + lateFee;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) {
      setError("Please select a resident.");
      return;
    }
    if (!dueDate) {
      setError("Please provide a due date.");
      return;
    }
    if (rent < 0) {
      setError("Rent amount cannot be negative.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await billingService.createBill({
        tenant_id: selectedTenant.id,
        rent,
        electricity: electricityAmount,
        elec_usage: parsedUsage,
        water,
        late_fee: lateFee,
        date: billingDate,
        due_date: dueDate,
        notes,
        prev_reading: showMeterCalc ? parseFloat(prevReading) || 0 : undefined,
        curr_reading: showMeterCalc ? parseFloat(currReading) || 0 : undefined,
      });

      onSuccess(res.message || `Bill issued successfully for ${selectedTenant.name}.`);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to create bill. Please check inputs."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Create Individual Bill"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-3 text-sm">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-danger-border bg-danger-bg p-2.5 text-xs font-semibold text-danger-fg animate-fade-in">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Resident Selection & Context Header */}
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
              className="w-full appearance-none rounded-xl border border-edge bg-inset px-3 py-2 pr-10 text-xs sm:text-sm font-medium text-fg shadow-2xs transition-all duration-150 hover:border-edge-strong focus:border-accent focus:bg-card focus:outline-none focus:ring-3 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {activeTenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} — Room {t.room} ({t.property_name})
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          </div>

          {selectedTenant && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted pl-0.5 pt-0.5">
              <Home className="h-3 w-3 text-accent shrink-0" />
              <span>{selectedTenant.property_name} • Room {selectedTenant.room}</span>
              <span className="text-edge-strong">•</span>
              <span>Base Rent: {formatCurrency(selectedTenant.room_rent)}</span>
            </div>
          )}
        </div>

        {/* 2. Fixed Rent & Water Charges */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs font-semibold text-fg-soft mb-1">
              Room Rent
            </label>
            <div className="relative flex items-center rounded-xl border border-edge bg-inset transition-all duration-150 focus-within:border-accent focus-within:bg-card focus-within:ring-3 focus-within:ring-accent/15">
              <span className="pl-3 text-xs font-bold text-muted select-none">₱</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={rent || ""}
                onChange={(e) => setRent(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full bg-transparent pl-1.5 pr-3 py-1.5 text-xs sm:text-sm font-semibold text-fg tabular-nums placeholder:text-faint focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-fg-soft mb-1">
              Water Utility
            </label>
            <div className="relative flex items-center rounded-xl border border-edge bg-inset transition-all duration-150 focus-within:border-accent focus-within:bg-card focus-within:ring-3 focus-within:ring-accent/15">
              <span className="pl-3 text-xs font-bold text-muted select-none">₱</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={water || ""}
                onChange={(e) => setWater(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full bg-transparent pl-1.5 pr-3 py-1.5 text-xs sm:text-sm font-semibold text-fg tabular-nums placeholder:text-faint focus:outline-none"
                required
              />
            </div>
          </div>
        </div>

        {/* 3. Electricity Usage Section */}
        <div className="rounded-xl border border-edge bg-card/60 p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-fg-soft">
              <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500/20" />
              <span>Electricity Consumption</span>
            </div>
            <button
              type="button"
              onClick={() => setShowMeterCalc(!showMeterCalc)}
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold transition-all cursor-pointer",
                showMeterCalc
                  ? "bg-accent/10 text-accent"
                  : "text-muted hover:text-fg hover:bg-hover"
              )}
            >
              <Calculator className="h-3 w-3" />
              <span>{showMeterCalc ? "Hide Sub-Meter" : "Use Sub-Meter"}</span>
              {showMeterCalc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>

          {/* Sub-Meter Helper Drawer */}
          {showMeterCalc && (
            <div className="rounded-lg border border-dashed border-edge-strong/70 bg-inset/70 p-2.5 space-y-2 text-xs animate-fade-in">
              <div className="flex items-center justify-between text-[10px] text-muted">
                <span>Enter sub-meter dial readings to calculate kWh:</span>
                {selectedTenant?.latest_reading ? (
                  <span className="text-accent font-medium">
                    Last: {selectedTenant.latest_reading}
                  </span>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-medium text-fg-soft mb-0.5">
                    Previous Reading
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="0.0"
                    value={prevReading}
                    onChange={(e) => handleMeterCalcChange(e.target.value, currReading)}
                    className="w-full rounded-lg border border-edge bg-card px-2 py-1 text-xs font-bold text-fg tabular-nums focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-fg-soft mb-0.5">
                    Current Reading (Today)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="0.0"
                    value={currReading}
                    onChange={(e) => handleMeterCalcChange(prevReading, e.target.value)}
                    className="w-full rounded-lg border border-edge bg-card px-2 py-1 text-xs font-bold text-fg tabular-nums focus:border-accent focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Usage & Rate Inputs */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-medium text-fg-soft mb-1">
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
                  className="w-full bg-transparent pl-3 pr-11 py-1.5 text-xs sm:text-sm font-bold text-fg tabular-nums placeholder:text-faint focus:outline-none"
                />
                <span className="pointer-events-none absolute right-2.5 text-[11px] font-semibold text-muted">
                  kWh
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-fg-soft mb-1">
                Rate per kWh
              </label>
              <div className="relative flex items-center rounded-xl border border-edge bg-inset transition-all duration-150 focus-within:border-accent focus-within:bg-card focus-within:ring-3 focus-within:ring-accent/15">
                <span className="pl-2.5 text-xs font-bold text-muted select-none">₱</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={elecRate}
                  onChange={(e) => setElecRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent pl-1 pr-12 py-1.5 text-xs sm:text-sm font-semibold text-fg tabular-nums focus:outline-none"
                />
                <span className="pointer-events-none absolute right-2 text-[10px] font-semibold text-muted">
                  /kWh
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-edge/60">
            <span className="text-[11px] text-muted">Calculated Electricity:</span>
            <div className="flex items-baseline gap-1.5 font-bold text-fg tabular-nums">
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
            <label className="block text-xs font-semibold text-fg-soft mb-1">
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
            <label className="block text-xs font-semibold text-fg-soft mb-1">
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
          <label className="block text-xs font-semibold text-fg-soft mb-1">
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

        {/* 5. Executive Statement Summary Card */}
        <div className="rounded-xl border border-edge bg-inset/60 p-3 space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-edge/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
              Statement Summary
            </span>
            <span className="text-[10px] font-medium uppercase text-faint tracking-wider">
              Live Preview
            </span>
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex justify-between items-center text-muted">
              <span>Room Rent</span>
              <span className="font-semibold text-fg tabular-nums">{formatCurrency(rent)}</span>
            </div>
            <div className="flex justify-between items-center text-muted">
              <span>Electricity ({parsedUsage} kWh)</span>
              <span className="font-semibold text-fg tabular-nums">{formatCurrency(electricityAmount)}</span>
            </div>
            <div className="flex justify-between items-center text-muted">
              <span>Water Utility</span>
              <span className="font-semibold text-fg tabular-nums">{formatCurrency(water)}</span>
            </div>
            {lateFee > 0 && (
              <div className="flex justify-between items-center text-danger-fg">
                <span>Late Fee / Surcharge</span>
                <span className="font-semibold tabular-nums">+{formatCurrency(lateFee)}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center border-t border-edge-strong/50 pt-2 mt-0.5">
            <div>
              <span className="text-xs font-bold text-fg block">Total Bill Amount</span>
              <span className="text-[10px] text-muted">Payable on or before {dueDate || "due date"}</span>
            </div>
            <span className="text-lg sm:text-xl font-extrabold text-accent tabular-nums tracking-tight">
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </div>

        {/* 6. Modal Actions */}
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
