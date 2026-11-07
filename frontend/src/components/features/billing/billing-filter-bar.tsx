import { Building2, Calendar, RotateCw, Users } from "lucide-react";
import { SearchInput } from "@/components/common/search-input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type { Property, Tenant } from "@/lib/types";

interface BillingFilterBarProps {
  properties: Property[];
  visibleTenants: Tenant[];
  availableMonths: string[];
  selectedPropertyId: string;
  selectedTenantId: string;
  selectedMonth: string;
  searchQuery: string;
  loading: boolean;
  onPropertyChange: (propertyId: string) => void;
  onTenantChange: (tenantId: string) => void;
  onMonthChange: (month: string) => void;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
  formatMonthLabel: (ym: string) => string;
}

export function BillingFilterBar({
  properties,
  visibleTenants,
  availableMonths,
  selectedPropertyId,
  selectedTenantId,
  selectedMonth,
  searchQuery,
  loading,
  onPropertyChange,
  onTenantChange,
  onMonthChange,
  onSearchChange,
  onRefresh,
  formatMonthLabel,
}: BillingFilterBarProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-card border border-edge rounded-lg shadow-sm">
      <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
        {/* Property Filter */}
        <div className="w-full sm:w-44">
          <Select
            value={selectedPropertyId}
            onChange={(e) => onPropertyChange(e.target.value)}
            className="h-8 text-xs font-medium"
          >
            <option value="">All Properties</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>

        {/* Tenant Filter */}
        <div className="w-full sm:w-44">
          <Select
            value={selectedTenantId}
            onChange={(e) => onTenantChange(e.target.value)}
            className="h-8 text-xs font-medium"
          >
            <option value="">All Active Residents</option>
            {visibleTenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} (Rm {t.room})
              </option>
            ))}
          </Select>
        </div>

        {/* Month / Period Filter */}
        <div className="w-full sm:w-36">
          <Select
            value={selectedMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="h-8 text-xs font-medium"
          >
            <option value="all">All Months</option>
            {availableMonths.map((ym) => (
              <option key={ym} value={ym}>
                {formatMonthLabel(ym)}
              </option>
            ))}
          </Select>
        </div>

        {/* Search Filter */}
        <div className="w-full sm:w-56">
          <SearchInput
            placeholder="Search tenant or room..."
            value={searchQuery}
            onChange={onSearchChange}
            className="h-8 text-xs"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          className="h-8 gap-1.5 text-xs text-muted hover:text-fg"
          title="Refresh data"
        >
          <RotateCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>
    </div>
  );
}

