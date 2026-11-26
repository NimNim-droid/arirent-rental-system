import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { INQUIRY_TABS } from "./inquiry-constants";
import type { InquiryStatus, InquiryStatusCounts, Property } from "@/lib/types";

interface InquiryFilterBarProps {
  counts: InquiryStatusCounts;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  propertyFilter: string;
  onPropertyFilterChange: (propertyId: string) => void;
  searchInput: string;
  onSearchChange: (query: string) => void;
  properties: Property[];
}

export function InquiryFilterBar({
  counts,
  statusFilter,
  onStatusFilterChange,
  propertyFilter,
  onPropertyFilterChange,
  searchInput,
  onSearchChange,
  properties,
}: InquiryFilterBarProps) {
  const openTotal = counts.new + counts.scheduled + counts.visited;

  const getTabCount = (key: string): number | null => {
    if (key === "open") return openTotal;
    if (key === "all") {
      return (
        counts.new +
        counts.scheduled +
        counts.visited +
        counts.converted +
        counts.cancelled
      );
    }
    return counts[key as InquiryStatus] ?? null;
  };

  return (
    <Card className="p-4 space-y-3.5">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {INQUIRY_TABS.map((tab) => {
          const count = getTabCount(tab.key);
          const active = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onStatusFilterChange(tab.key)}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                active
                  ? "bg-accent text-white"
                  : "bg-inset text-fg-soft hover:bg-hover hover:text-fg border border-edge"
              }`}
            >
              <span>{tab.label}</span>
              {count !== null && (
                <span
                  className={`rounded px-1.5 py-0.2 text-[11px] tabular-nums ${
                    active ? "bg-white/20 text-white" : "bg-card text-muted"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-7">
          <Input
            id="inquirySearch"
            placeholder="Search visitor name, mobile number, email, or note..."
            icon={<Search className="h-3.5 w-3.5" />}
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="sm:col-span-5">
          <Select
            id="inquiryPropertyFilter"
            value={propertyFilter}
            onChange={(e) => onPropertyFilterChange(e.target.value)}
          >
            <option value="all">All Buildings</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </Card>
  );
}
