import { DoorOpen } from "lucide-react";
import { SectionHeader } from "@/components/common/section-header";
import { SearchInput } from "@/components/common/search-input";
import { Select } from "@/components/ui/select";
import type { Property, Room } from "@/lib/types";

interface RoomFiltersProps {
  rooms: Room[];
  filteredCount: number;
  properties: Property[];
  searchQuery: string;
  selectedPropertyFilter: string;
  selectedStatusFilter: string;
  onSearchChange: (val: string) => void;
  onPropertyFilterChange: (val: string) => void;
  onStatusFilterChange: (val: string) => void;
}

export function RoomFilters({
  rooms,
  filteredCount,
  properties,
  searchQuery,
  selectedPropertyFilter,
  selectedStatusFilter,
  onSearchChange,
  onPropertyFilterChange,
  onStatusFilterChange,
}: RoomFiltersProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <SectionHeader
            dot
            dotClassName="text-accent"
            icon={<DoorOpen className="h-4 w-4" />}
            title="Rental Units Inventory"
            subtitle={`Viewing ${filteredCount} of ${rooms.length} registered units.`}
          />
        </div>

        {/* Quick status filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(["all", "vacant", "reserved", "occupied"] as const).map((status) => {
            const active = selectedStatusFilter === status;
            const count =
              status === "all"
                ? rooms.length
                : rooms.filter((r) => r.status === status).length;

            return (
              <button
                key={status}
                type="button"
                onClick={() => onStatusFilterChange(status)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium tabular-nums capitalize transition-colors cursor-pointer ${
                  active
                    ? "bg-accent text-white shadow-soft"
                    : "bg-card text-muted border border-edge hover:bg-hover hover:text-fg"
                }`}
              >
                {status} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter controls row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <SearchInput
            placeholder="Search by room number or building..."
            label="Search units"
            value={searchQuery}
            onChange={onSearchChange}
          />
        </div>

        <div>
          <Select
            id="filterProperty"
            value={selectedPropertyFilter}
            onChange={(e) => onPropertyFilterChange(e.target.value)}
          >
            <option value="all">All Buildings ({properties.length})</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </div>
  );
}
