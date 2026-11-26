import { Search, SlidersHorizontal, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const BUDGET_OPTIONS = [
  { label: "Any monthly budget", value: "" },
  { label: "Up to ₱6,000 / mo", value: "6000" },
  { label: "Up to ₱9,000 / mo", value: "9000" },
  { label: "Up to ₱12,000 / mo", value: "12000" },
  { label: "Up to ₱15,000 / mo", value: "15000" },
  { label: "Up to ₱20,000 / mo", value: "20000" },
];

const CAPACITY_OPTIONS = [
  { label: "Any capacity", value: "" },
  { label: "Solo (1+ person)", value: "1" },
  { label: "2+ occupants", value: "2" },
  { label: "3+ occupants", value: "3" },
];

interface PublicListingFiltersProps {
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
}

export function PublicListingFilters({
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
}: PublicListingFiltersProps) {
  return (
    <Card className="p-3.5 sm:p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
        <div className="sm:col-span-2 lg:col-span-5">
          <Input
            id="listingSearch"
            label="Search Building or Location"
            placeholder="Building name, street, or city..."
            icon={<Search className="h-3.5 w-3.5" />}
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="lg:col-span-3">
          <Select
            id="listingCity"
            label="City"
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
          >
            <option value="all">All locations</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>

        <div className="lg:col-span-2">
          <Select
            id="listingBudget"
            label="Monthly Budget"
            value={maxRent}
            onChange={(e) => onMaxRentChange(e.target.value)}
          >
            {BUDGET_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="lg:col-span-2">
          <Select
            id="listingCapacity"
            label="Occupants"
            value={capacity}
            onChange={(e) => onCapacityChange(e.target.value)}
          >
            {CAPACITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="mt-3 flex items-center justify-between border-t border-edge pt-2.5 text-xs">
          <span className="inline-flex items-center gap-1.5 text-muted">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Showing filtered results ({resultCount})
          </span>
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex items-center gap-1 font-medium text-accent hover:text-accent-strong cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
            Clear filters
          </button>
        </div>
      )}
    </Card>
  );
}
