import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import type { PublicSiblingRoom } from "@/lib/types";

interface SiblingRoomsGridProps {
  buildingId: string;
  buildingName: string;
  rooms: PublicSiblingRoom[];
}

export function SiblingRoomsGrid({
  buildingId,
  buildingName,
  rooms,
}: SiblingRoomsGridProps) {
  if (rooms.length === 0) return null;

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-fg">Other Vacant Units in {buildingName}</h2>
        <Link
          to={`/properties/${buildingId}`}
          className="text-xs font-medium text-accent hover:text-accent-strong"
        >
          View building &rarr;
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {rooms.slice(0, 4).map((sibling) => (
          <Link key={sibling.id} to={`/rooms/${sibling.id}`}>
            <Card className="p-3.5 flex items-center justify-between gap-3 hover:border-edge-strong transition-colors">
              <div>
                <p className="text-sm font-semibold text-fg">Room {sibling.room_number}</p>
                <p className="text-xs text-muted">
                  Up to {sibling.capacity} {sibling.capacity === 1 ? "person" : "persons"}
                  {sibling.floor_area != null ? ` · ${sibling.floor_area} sqm` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-fg tabular-nums">
                  {formatCurrency(sibling.rent)}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-muted" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
