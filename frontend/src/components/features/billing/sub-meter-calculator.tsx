import { Calculator, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Tenant } from "@/lib/types";

interface SubMeterCalculatorProps {
  showMeterCalc: boolean;
  onToggle: () => void;
  selectedTenant?: Tenant;
  prevReading: string;
  currReading: string;
  onReadingChange: (prevStr: string, currStr: string) => void;
}

export function SubMeterCalculator({
  showMeterCalc,
  onToggle,
  selectedTenant,
  prevReading,
  currReading,
  onReadingChange,
}: SubMeterCalculatorProps) {
  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold transition-all",
          showMeterCalc
            ? "bg-accent/10 text-accent"
            : "text-muted hover:bg-hover hover:text-fg"
        )}
      >
        <Calculator className="h-3 w-3" />
        <span>{showMeterCalc ? "Hide Sub-Meter" : "Use Sub-Meter"}</span>
        {showMeterCalc ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
      </button>

      {showMeterCalc && (
        <div className="animate-fade-in space-y-2 rounded-lg border border-dashed border-edge-strong/70 bg-inset/70 p-2.5 text-xs">
          <div className="flex items-center justify-between text-[10px] text-muted">
            <span>Enter sub-meter dial readings to calculate kWh:</span>
            {selectedTenant?.latest_reading ? (
              <span className="font-medium text-accent">
                Last: {selectedTenant.latest_reading}
              </span>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-0.5 block text-[10px] font-medium text-fg-soft">
                Previous Reading
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder="0.0"
                value={prevReading}
                onChange={(e) => onReadingChange(e.target.value, currReading)}
                className="w-full rounded-lg border border-edge bg-card px-2 py-1 text-xs font-bold tabular-nums text-fg focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-0.5 block text-[10px] font-medium text-fg-soft">
                Current Reading (Today)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder="0.0"
                value={currReading}
                onChange={(e) => onReadingChange(prevReading, e.target.value)}
                className="w-full rounded-lg border border-edge bg-card px-2 py-1 text-xs font-bold tabular-nums text-fg focus:border-accent focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
