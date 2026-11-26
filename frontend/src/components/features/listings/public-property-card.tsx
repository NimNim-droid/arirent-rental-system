import { Link } from "react-router";
import { ArrowRight, Building2, Calendar, DoorOpen, MapPin, Users } from "lucide-react";
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
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-edge bg-card shadow-card transition-all duration-200 hover:border-edge-strong hover:shadow-pop">
      {/* Property Media */}
      <div className="relative">
        <Link
          to={`/properties/${property.id}`}
          className="relative block h-52 sm:h-56 w-full overflow-hidden bg-inset border-b border-edge"
        >
          {property.cover_photo_url ? (
            <img
              src={property.cover_photo_url}
              alt={property.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <ListingMediaPlaceholder
              kind="property"
              label="Click to view units & building details"
              className="h-full w-full"
            />
          )}

          {/* Top-left Status Badge */}
          <div className="absolute left-3.5 top-3.5 flex items-center gap-1.5">
            {property.available_rooms_count > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white shadow-soft">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-200" />
                {property.available_rooms_count} Vacant{" "}
                {property.available_rooms_count === 1 ? "Unit" : "Units"}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-slate-900/75 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                All Units Leased
              </span>
            )}
          </div>

          {/* Top-right City Pill */}
          <span className="absolute right-3.5 top-3.5 inline-flex items-center gap-1 rounded-full bg-card/92 px-2.5 py-1 text-[11px] font-semibold text-fg shadow-soft backdrop-blur-sm">
            <MapPin className="h-3 w-3 text-accent" />
            {property.city}
          </span>
        </Link>

        {/* Architectural Floating Icon Badge on Seam */}
        <div
          aria-hidden="true"
          className="absolute -bottom-5 left-5 flex h-10 w-10 items-center justify-center rounded-full border border-edge bg-card text-accent shadow-card"
        >
          <Building2 className="h-4 w-4" />
        </div>
      </div>

      {/* Property Details */}
      <div className="flex flex-1 flex-col justify-between p-5 pt-7 space-y-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                to={`/properties/${property.id}`}
                className="text-base sm:text-lg font-bold tracking-tight text-fg hover:text-accent transition-colors line-clamp-1"
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
                <p className="text-[11px] font-medium text-muted">Starts at</p>
                <p className="text-base font-extrabold text-accent tabular-nums leading-tight">
                  {formatCurrency(property.starting_rent)}
                  <span className="text-[11px] font-medium text-muted">/mo</span>
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
                  className="inline-flex items-center rounded-full border border-edge bg-inset px-2.5 py-0.5 text-[11px] font-medium text-fg-soft"
                >
                  {amenity}
                </span>
              ))}
              {property.amenities.length > 4 && (
                <span className="inline-flex items-center px-1.5 py-0.5 text-[11px] font-medium text-muted">
                  +{property.amenities.length - 4} more
                </span>
              )}
            </div>
          )}

          {vacantRooms.length > 0 && (
            <div className="rounded-xl border border-edge bg-inset/70 p-3 space-y-2">
              <p className="text-[11px] font-semibold text-muted">
                Vacant units open for viewing:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {vacantRooms.slice(0, 3).map((room) => (
                  <Link
                    key={room.id}
                    to={`/rooms/${room.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-edge bg-card px-2.5 py-1.5 text-xs font-medium text-fg hover:border-accent hover:text-accent transition-colors"
                  >
                    <DoorOpen className="h-3.5 w-3.5 text-accent" />
                    <span>Room {room.room_number}</span>
                    <span className="text-edge-strong">&middot;</span>
                    <span className="tabular-nums font-bold text-accent">
                      {formatCurrency(room.rent)}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-[11px] text-muted">
                      <Users className="h-3 w-3" />
                      {room.capacity}
                    </span>
                  </Link>
                ))}
                {vacantRooms.length > 3 && (
                  <Link
                    to={`/properties/${property.id}`}
                    className="inline-flex items-center px-2 py-1 text-xs font-semibold text-accent hover:underline"
                  >
                    +{vacantRooms.length - 3} more
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-edge pt-4">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => onScheduleVisit(property)}
            className="h-9 rounded-xl w-full sm:w-auto justify-center"
          >
            <Calendar className="h-3.5 w-3.5 text-accent" />
            <span>Schedule Visit</span>
          </Button>

          <Link to={`/properties/${property.id}`} className="w-full sm:w-auto">
            <Button
              size="md"
              variant="primary"
              className="h-9 rounded-xl w-full justify-center font-semibold"
            >
              <span>View Units ({property.listed_rooms_count})</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </article>
  );
}
