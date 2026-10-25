import { BarChart3, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type { Property } from "@/lib/types";
import { formatClockTime, formatMonthLabel } from "./report-utils";

interface ReportFiltersProps {
  selectedMonth: string;
  selectedPropertyId: string;
  availableMonths: string[];
  properties: Property[];
  lastUpdated: Date | null;
  onMonthChange: (value: string) => void;
  onPropertyChange: (value: string) => void;
  onReset: () => void;
  onRefresh: () => void;
}

export function ReportFilters({
  selectedMonth,
  selectedPropertyId,
  availableMonths,
  properties,
  lastUpdated,
  onMonthChange,
  onPropertyChange,
  onReset,
  onRefresh,
}: ReportFiltersProps) {
  const propertyName = selectedPropertyId
    ? properties.find((p) => String(p.id) === String(selectedPropertyId))?.name ||
      "Filtered Property"
    : "All Properties";

  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 bg-card p-3 rounded-2xl border border-edge shadow-sm print:hidden">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-semibold text-fg px-2">
        <BarChart3 className="h-4 w-4 text-accent" />
        <span>Report Scope:</span>
        <span className="font-mono text-muted font-normal">
          {selectedMonth === "all" ? "All Time" : formatMonthLabel(selectedMonth)} • {propertyName}
        </span>
        {lastUpdated && (
          <span className="font-normal text-muted">· Updated {formatClockTime(lastUpdated)}</span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="w-[140px] sm:w-auto">
          <Select
            value={selectedMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="text-xs h-9 min-w-[135px]"
          >
            <option value="all">All Months</option>
            {availableMonths.map((ym) => (
              <option key={ym} value={ym}>
                {formatMonthLabel(ym)}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-[140px] sm:w-auto">
          <Select
            value={selectedPropertyId}
            onChange={(e) => onPropertyChange(e.target.value)}
            className="text-xs h-9 min-w-[135px]"
          >
            <option value="">All Properties</option>
            {properties.map((p) => (
              <option key={p.id} value={String(p.id)}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>

        {(selectedMonth !== "all" || selectedPropertyId) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-9 px-2.5 text-xs text-muted hover:text-fg gap-1"
            title="Reset all filters"
          >
            <RotateCw className="h-3 w-3" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="h-9 px-2.5 text-xs text-muted hover:text-fg gap-1.5"
          title="Refresh analytics data"
        >
          <RotateCw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>
    </div>
  );
}
