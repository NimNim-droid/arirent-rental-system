import type { FormEvent } from "react";
import {
  Building2,
  CheckCircle2,
  MapPin,
  Search,
  SlidersHorizontal,
  User,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import {
  OCCUPANCY_OPTIONS,
  RENT_BUDGET_OPTIONS,
  type ListingQuickMode,
} from "./listing-helpers";

const QUICK_TABS: Array<{
  id: ListingQuickMode;
  label: string;
  icon: typeof Building2;
}> = [
  { id: "all", label: "All Properties", icon: Building2 },
  { id: "vacant", label: "Vacant Ready", icon: CheckCircle2 },
  { id: "solo", label: "Solo Units", icon: User },
  { id: "shared", label: "2+ Occupants", icon: Users },
];

interface PublicListingFiltersProps {
  quickMode?: ListingQuickMode;
  onQuickModeChange?: (mode: ListingQuickMode) => void;
  searchInput: string;
  onSearchChange: (value: string) => void;
  city: string;
  onCityChange: (value: string) => void;
  cities: string[];
  maxRent: string;
  onMaxRentChange: (value: string) => void;
  capacity: string;
  onCapacityChange: (value: string) => void;
  hasActiveFilters: boolean;
  resultCount: number;
  onClearFilters: () => void;
  onSubmitSearch?: () => void;
  floating?: boolean;
}

export function PublicListingFilters({
  quickMode,
  onQuickModeChange,
  searchInput,
  onSearchChange,
  city,
  onCityChange,
  cities,
  maxRent,
  onMaxRentChange,
  capacity,
  onCapacityChange,
  hasActiveFilters,
  resultCount,
  onClearFilters,
  onSubmitSearch,
  floating = true,
}: PublicListingFiltersProps) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmitSearch?.();
  };

  const showTabs = Boolean(quickMode && onQuickModeChange);

  return (
    <div
      className={cn(
        "relative z-20",
        floating && "mx-auto max-w-6xl px-4 sm:px-6 -mt-12 sm:-mt-14"
      )}
    >
      {/* Optional quick-mode toggle group (only shown when a page wires it up) */}
      {showTabs && (
      <div
        role="group"
        aria-label="Filter listings by unit availability"
        className="inline-flex max-w-full overflow-x-auto no-scrollbar rounded-t-xl border border-b-0 border-edge bg-inset/95 backdrop-blur-sm p-1 shadow-soft"
      >
        {QUICK_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = quickMode === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              aria-pressed={active}
              onClick={() => onQuickModeChange?.(tab.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap",
                active
                  ? "bg-card text-accent shadow-soft"
                  : "text-muted hover:text-fg"
              )}
            >
              <Icon className={cn("h-3.5 w-3.5", active ? "text-accent" : "text-faint")} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
      )}

      {/* Floating Search Form Card */}
      <form
        onSubmit={handleSubmit}
        className={cn(
          "border border-edge bg-card p-4 sm:p-5 shadow-pop",
          showTabs ? "rounded-b-2xl rounded-tr-2xl" : "rounded-2xl"
        )}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-3.5 items-end">
          {/* Search query */}
          <div className="sm:col-span-2 lg:col-span-4 space-y-1.5">
            <label
              htmlFor="listingSearch"
              className="block text-xs font-medium text-muted"
            >
              Location or Building
            </label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-faint" />
              <input
                id="listingSearch"
                type="text"
                placeholder="Building name, street, or city..."
                value={searchInput}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full h-10 rounded-xl border border-edge bg-inset/60 pl-9 pr-3 text-sm sm:text-[13px] text-fg placeholder:text-faint focus:border-accent focus:bg-card focus:outline-none focus:ring-2 focus:ring-accent/20 transition-colors"
              />
            </div>
          </div>

          {/* City select */}
          <div className="lg:col-span-2 space-y-1.5">
            <label
              htmlFor="listingCity"
              className="block text-xs font-medium text-muted"
            >
              City
            </label>
            <select
              id="listingCity"
              value={city}
              onChange={(e) => onCityChange(e.target.value)}
              className="w-full h-10 rounded-xl border border-edge bg-inset/60 px-3 pr-8 text-sm sm:text-[13px] text-fg focus:border-accent focus:bg-card focus:outline-none focus:ring-2 focus:ring-accent/20 transition-colors select-chevron"
            >
              <option value="all">All locations</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Monthly Budget */}
          <div className="lg:col-span-2 space-y-1.5">
            <label
              htmlFor="listingBudget"
              className="block text-xs font-medium text-muted"
            >
              Monthly Rent
            </label>
            <select
              id="listingBudget"
              value={maxRent}
              onChange={(e) => onMaxRentChange(e.target.value)}
              className="w-full h-10 rounded-xl border border-edge bg-inset/60 px-3 pr-8 text-sm sm:text-[13px] text-fg focus:border-accent focus:bg-card focus:outline-none focus:ring-2 focus:ring-accent/20 transition-colors select-chevron"
            >
              {RENT_BUDGET_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Capacity */}
          <div className="lg:col-span-2 space-y-1.5">
            <label
              htmlFor="listingCapacity"
              className="block text-xs font-medium text-muted"
            >
              Occupants
            </label>
            <select
              id="listingCapacity"
              value={capacity}
              onChange={(e) => onCapacityChange(e.target.value)}
              className="w-full h-10 rounded-xl border border-edge bg-inset/60 px-3 pr-8 text-sm sm:text-[13px] text-fg focus:border-accent focus:bg-card focus:outline-none focus:ring-2 focus:ring-accent/20 transition-colors select-chevron"
            >
              {OCCUPANCY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Search CTA */}
          <div className="sm:col-span-2 lg:col-span-2">
            <Button
              type="submit"
              size="lg"
              className="w-full h-10 rounded-xl text-sm sm:text-[13px] font-semibold"
            >
              <Search className="h-4 w-4" />
              <span>Search</span>
            </Button>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-edge pt-3 text-xs">
            <span className="inline-flex items-center gap-1.5 text-muted">
              <SlidersHorizontal className="h-3.5 w-3.5 text-accent" />
              <span>
                Showing <strong className="text-fg tabular-nums">{resultCount}</strong> matching{" "}
                {resultCount === 1 ? "property" : "properties"}
              </span>
            </span>
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex items-center gap-1 font-semibold text-accent hover:text-accent-strong cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              Reset filters
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
