import { Building, Plus } from "lucide-react";
import { SectionHeader } from "@/components/common/section-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { PropertyCard } from "./property-card";
import type { Property } from "@/lib/types";

interface PropertyGridProps {
  properties: Property[];
  loading: boolean;
  selectedFilter: string;
  onSelectFilter: (id: string) => void;
  onOpenAdd: () => void;
  onAddRoom: (propertyId: string) => void;
  onEdit: (property: Property) => void;
  onDelete: (property: Property) => void;
}

export function PropertyGrid({
  properties,
  loading,
  selectedFilter,
  onSelectFilter,
  onOpenAdd,
  onAddRoom,
  onEdit,
  onDelete,
}: PropertyGridProps) {
  return (
    <div className="space-y-4">
      <SectionHeader
        dot
        dotClassName="text-accent"
        icon={<Building className="h-5 w-5" />}
        title="Managed Buildings & Properties"
        subtitle="Click any building to filter rooms below"
        action={
          <Button size="sm" onClick={onOpenAdd} className="font-semibold text-xs">
            <Plus className="h-4 w-4" />
            Add Building
          </Button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-md border border-edge bg-card p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-md" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="pt-2 flex justify-between border-t border-edge">
                <Skeleton className="h-6 w-20 rounded" />
                <Skeleton className="h-6 w-12 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            title="No properties listed yet"
            description="Add your first building to start managing rooms and tenants."
            action={
              <Button size="sm" onClick={onOpenAdd}>
                <Plus className="h-4 w-4" /> Add Building
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              isSelected={selectedFilter === property.id}
              onSelect={onSelectFilter}
              onAddRoom={onAddRoom}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
