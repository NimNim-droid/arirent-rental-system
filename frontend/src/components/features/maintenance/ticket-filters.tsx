import { Archive } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MAINTENANCE_FILTERS } from "./hooks/useAdminMaintenance";

interface TicketFiltersProps {
  currentFilter: string;
  counts: Record<string, number>;
  showArchived: boolean;
  archivedCount: number;
  onFilterChange: (filter: string) => void;
  onToggleArchived: () => void;
}

export function TicketFilters({
  currentFilter,
  counts,
  showArchived,
  archivedCount,
  onFilterChange,
  onToggleArchived,
}: TicketFiltersProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-2">
        {MAINTENANCE_FILTERS.map((tab) => (
          <Button
            key={tab.value}
            variant={currentFilter === tab.value && !showArchived ? "primary" : "secondary"}
            size="sm"
            onClick={() => onFilterChange(tab.value)}
            className="flex items-center gap-1.5"
          >
            {tab.label}
            <Badge
              variant={currentFilter === tab.value && !showArchived ? "neutral" : "neutral"}
              className="ml-1 text-[10px]"
            >
              {counts[tab.value] ?? 0}
            </Badge>
          </Button>
        ))}
      </div>

      {archivedCount > 0 && (
        <Button
          variant={showArchived ? "primary" : "ghost"}
          size="sm"
          onClick={onToggleArchived}
          className="text-xs text-muted hover:text-fg"
        >
          <Archive className="h-3.5 w-3.5 mr-1" />
          {showArchived ? "Show Active Tickets" : `Archived (${archivedCount})`}
        </Button>
      )}
    </div>
  );
}
