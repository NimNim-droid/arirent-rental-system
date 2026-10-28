import { CalendarDays, RotateCcw, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Property } from "@/lib/types";

interface TicketToolbarProps {
  search: string;
  statusFilter: string;
  propertyFilter: string;
  dateFrom: string;
  dateTo: string;
  archivedCount: number;
  properties: Property[];
  propertiesLoading: boolean;
  filtersActive: boolean;
  resultCount: number;
  totalCount: number;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onPropertyChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onReset: () => void;
}

export function TicketToolbar({
  search,
  statusFilter,
  propertyFilter,
  dateFrom,
  dateTo,
  archivedCount,
  properties,
  propertiesLoading,
  filtersActive,
  resultCount,
  totalCount,
  onSearchChange,
  onStatusChange,
  onPropertyChange,
  onDateFromChange,
  onDateToChange,
  onReset,
}: TicketToolbarProps) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <Input
          type="search"
          icon={<Search className="h-4 w-4" />}
          placeholder="Search by tenant name, room, or issue..."
          aria-label="Search tickets"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="lg:flex-1 lg:min-w-[220px]"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:flex lg:w-auto">
          <Select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="lg:w-40"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="archived">Archived{archivedCount > 0 ? ` (${archivedCount})` : ""}</option>
          </Select>

          <Select
            aria-label="Filter by property"
            value={propertyFilter}
            onChange={(e) => onPropertyChange(e.target.value)}
            disabled={propertiesLoading && properties.length === 0}
            className="lg:w-48"
          >
            <option value="all">All Properties</option>
            {propertiesLoading && properties.length === 0 && (
              <option value="loading" disabled>
                Loading properties...
              </option>
            )}
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-edge bg-inset px-3 py-1.5 lg:w-auto">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-fg-soft whitespace-nowrap">
            <CalendarDays className="h-4 w-4 text-muted" />
            Date Range
          </span>
          <input
            type="date"
            aria-label="Date from"
            value={dateFrom}
            max={dateTo || undefined}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="w-full min-w-[110px] rounded-lg bg-transparent px-2 py-1.5 text-xs text-fg focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
          <span className="text-faint text-xs">–</span>
          <input
            type="date"
            aria-label="Date to"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(e) => onDateToChange(e.target.value)}
            className="w-full min-w-[110px] rounded-lg bg-transparent px-2 py-1.5 text-xs text-fg focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>

        <div className="flex items-center justify-between gap-3 lg:ml-auto">
          <p className="text-xs text-muted whitespace-nowrap">
            {resultCount} of {totalCount} tickets
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            disabled={!filtersActive}
            className="whitespace-nowrap"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
      </div>
    </Card>
  );
}
