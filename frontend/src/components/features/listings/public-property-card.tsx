import { Link } from "react-router";
import { ArrowRight, Calendar, DoorOpen, MapPin, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListingMediaPlaceholder } from "./listing-media-placeholder";
import { formatCurrency } from "@/lib/formatters";
import type { PublicProperty } from "@/lib/types";

interface PublicPropertyCardProps {
  property: PublicProperty;
  onScheduleVisit: (property: PublicProperty) => void;
}

export function PublicPropertyCard({ property, onScheduleVisit }: PublicPropertyCardProps) {
  const vacantRooms = property.rooms.filter((r) => r.is_available);

  return (
    <Card className="flex flex-col overflow-hidden hover:border-edge-strong transition-colors">
      <Link
        to={`/properties/${property.id}`}
        className="group relative block h-52 w-full overflow-hidden bg-inset border-b border-edge"
      >
        {property.cover_photo_url ? (
          <img
            src={property.cover_photo_url}
            alt={property.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <ListingMediaPlaceholder
            kind="property"
            label="Click to view units & building details"
            className="h-full w-full"
          />
        )}

        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          {property.available_rooms_count > 0 ? (
            <Badge variant="success" dot className="shadow-soft bg-card/95 backdrop-blur">
              {property.available_rooms_count} vacant{" "}
              {property.available_rooms_count === 1 ? "unit" : "units"}
            </Badge>
          ) : (
            <Badge variant="neutral" className="shadow-soft bg-card/95 backdrop-blur">
              All listed units leased
            </Badge>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                to={`/properties/${property.id}`}
                className="text-base font-semibold text-fg hover:text-accent transition-colors line-clamp-1"
              >
                {property.name}
              </Link>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-faint" />
                <span className="truncate">
                  {property.address}, {property.city}
                </span>
              </p>
            </div>

            {property.starting_rent != null && (
              <div className="text-right shrink-0">
                <p className="text-[11px] text-muted">Starts at</p>
                <p className="text-sm font-bold text-fg tabular-nums">
                  {formatCurrency(property.starting_rent)}
                  <span className="text-xs font-normal text-muted">/mo</span>
                </p>
              </div>
            )}
          </div>

          {property.description && (
            <p className="text-xs text-fg-soft leading-relaxed line-clamp-2">
              {property.description}
            </p>
          )}

          {property.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {property.amenities.slice(0, 4).map((amenity) => (
                <span
                  key={amenity}
                  className="inline-flex items-center rounded border border-edge bg-inset px-2 py-0.5 text-[11px] text-fg-soft"
                >
                  {amenity}
                </span>
              ))}
              {property.amenities.length > 4 && (
                <span className="inline-flex items-center px-1.5 py-0.5 text-[11px] text-muted">
                  +{property.amenities.length - 4} more
                </span>
              )}
            </div>
          )}

          {vacantRooms.length > 0 && (
            <div className="rounded-lg border border-edge bg-inset p-2.5 space-y-1.5">
              <p className="text-[11px] font-medium text-muted">Vacant units ready for viewing:</p>
              <div className="flex flex-wrap gap-1.5">
                {vacantRooms.slice(0, 3).map((room) => (
                  <Link
                    key={room.id}
                    to={`/rooms/${room.id}`}
                    className="inline-flex items-center gap-1.5 rounded-md border border-edge bg-card px-2.5 py-1 text-xs font-medium text-fg hover:border-accent hover:text-accent transition-colors"
                  >
                    <DoorOpen className="h-3 w-3 text-muted" />
                    <span>Room {room.room_number}</span>
                    <span className="text-muted">&middot;</span>
                    <span className="tabular-nums font-semibold">{formatCurrency(room.rent)}</span>
                    <span className="inline-flex items-center gap-0.5 text-[11px] text-muted">
                      <Users className="h-3 w-3" />
                      {room.capacity}
                    </span>
                  </Link>
                ))}
                {vacantRooms.length > 3 && (
                  <Link
                    to={`/properties/${property.id}`}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-accent hover:underline"
                  >
                    +{vacantRooms.length - 3} more
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-edge pt-3.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onScheduleVisit(property)}
          >
            <Calendar className="h-3.5 w-3.5" />
            Schedule Visit
          </Button>

          <Link to={`/properties/${property.id}`}>
            <Button size="sm" variant="primary">
              View Units ({property.listed_rooms_count})
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
