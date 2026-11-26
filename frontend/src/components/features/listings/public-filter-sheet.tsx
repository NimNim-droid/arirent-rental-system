import { Building2, CheckCircle2, RotateCcw, User, Users } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/cn";
import {
  OCCUPANCY_OPTIONS,
  RENT_BUDGET_OPTIONS,
  type ListingQuickMode,
} from "./listing-helpers";

const MODE_OPTIONS: Array<{
  id: ListingQuickMode;
  label: string;
  icon: typeof Building2;
}> = [
  { id: "all", label: "All", icon: Building2 },
  { id: "vacant", label: "Vacant Ready", icon: CheckCircle2 },
  { id: "solo", label: "Solo Units", icon: User },
  { id: "shared", label: "2+ Pax", icon: Users },
];

interface PublicFilterSheetProps {
  open: boolean;
  onClose: () => void;
  quickMode: ListingQuickMode;
  onQuickModeChange: (mode: ListingQuickMode) => void;
  city: string;
  onCityChange: (value: string) => void;
  cities: string[];
  maxRent: string;
  onMaxRentChange: (value: string) => void;
  capacity: string;
  onCapacityChange: (value: string) => void;
  resultCount: number;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onApply?: () => void;
}

/**
 * Mobile bottom sheet (desktop centered dialog) for refining building & room listings.
 */
export function PublicFilterSheet({
  open,
  onClose,
  quickMode,
  onQuickModeChange,
  city,
  onCityChange,
  cities,
  maxRent,
  onMaxRentChange,
  capacity,
  onCapacityChange,
  resultCount,
  hasActiveFilters,
  onClearFilters,
  onApply,
}: PublicFilterSheetProps) {
  const handleApply = () => {
    onApply?.();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Filter Properties"
      maxWidth="sm"
      footer={
        <div className="flex w-full items-center gap-2.5">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            disabled={!hasActiveFilters}
            onClick={onClearFilters}
            className="h-10 rounded-xl px-4 font-semibold"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </Button>
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={handleApply}
            className="h-10 flex-1 rounded-xl font-semibold"
          >
            Show {resultCount} {resultCount === 1 ? "Property" : "Properties"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Availability &amp; Unit Fit
          </p>
          <div className="grid grid-cols-2 gap-2">
            {MODE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = quickMode === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onQuickModeChange(opt.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors cursor-pointer",
                    active
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-edge bg-inset/60 text-fg-soft hover:border-edge-strong hover:text-fg"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <Select
          id="sheetCity"
          label="City / Location"
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          className="h-10 rounded-xl"
        >
          <option value="all">All locations</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>

        <Select
          id="sheetBudget"
          label="Maximum Monthly Rent"
          value={maxRent}
          onChange={(e) => onMaxRentChange(e.target.value)}
          className="h-10 rounded-xl"
        >
          {RENT_BUDGET_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>

        <Select
          id="sheetCapacity"
          label="Minimum Occupant Capacity"
          value={capacity}
          onChange={(e) => onCapacityChange(e.target.value)}
          className="h-10 rounded-xl"
        >
          {OCCUPANCY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </div>
    </Modal>
  );
}
