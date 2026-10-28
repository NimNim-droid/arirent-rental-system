import { Building, MapPin, Plus, Edit2, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Property } from "@/lib/types";

interface PropertyCardProps {
  property: Property;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onAddRoom: (propertyId: string) => void;
  onEdit: (property: Property) => void;
  onDelete: (property: Property) => void;
}

export function PropertyCard({
  property,
  isSelected,
  onSelect,
  onAddRoom,
  onEdit,
  onDelete,
}: PropertyCardProps) {
  const totalUnits = property.rooms_count ?? 0;
  const occupied = property.occupied_count ?? 0;
  const vacant = Math.max(0, totalUnits - occupied);
  const occPct = totalUnits > 0 ? Math.round((occupied / totalUnits) * 100) : 0;

  return (
    <Card
      className={`relative flex flex-col justify-between p-5 transition-all duration-200 cursor-pointer border ${
        isSelected
          ? "ring-2 ring-accent border-accent/40 bg-accent-soft/30 shadow-md"
          : "hover:border-fg-soft/30 hover:shadow-md"
      }`}
      onClick={() => onSelect(property.id)}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-edge bg-inset text-faint">
              <Building className="h-4 w-4" />
            </div>
            <div>
              <h4 className="font-medium text-[13px] text-fg leading-tight hover:text-accent">
                {property.name}
              </h4>
              <span className="text-xs text-muted">
                {property.city}
              </span>
            </div>
          </div>

          {isSelected && (
            <Badge variant="info">Selected</Badge>
          )}
        </div>

        <p className="flex items-center gap-1.5 text-xs text-muted">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-faint" />
          <span className="truncate">{property.address}</span>
        </p>

        {/* Progress & Breakdown */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">Occupancy ({occPct}%)</span>
            <span className="text-fg font-medium tabular-nums">
              {occupied} / {totalUnits} units
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-hover overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all duration-150"
              style={{ width: `${occPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted">
            <span className="text-success-fg font-medium">
              {vacant} Vacant
            </span>
            <span className="text-muted">{occupied} Occupied</span>
          </div>
        </div>
      </div>

      {/* Actions footer */}
      <div
        className="flex items-center justify-between gap-2 border-t border-edge pt-3 mt-4"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="sm"
          className="text-xs px-2 h-7 font-semibold text-accent hover:bg-accent-soft"
          onClick={() => onAddRoom(property.id)}
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Unit</span>
        </Button>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted hover:text-fg"
            title="Edit building"
            onClick={() => onEdit(property)}
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-danger-fg hover:bg-danger-bg hover:text-danger-fg"
            title="Delete building"
            onClick={() => onDelete(property)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
