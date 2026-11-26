import { Link } from "react-router";
import { ArrowRight, MapPin, Maximize2, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListingMediaPlaceholder } from "./listing-media-placeholder";
import { formatCurrency } from "@/lib/formatters";
import type { FeaturedPublicRoom } from "./listing-helpers";

interface FeaturedUnitsSectionProps {
  rooms: FeaturedPublicRoom[];
  loading: boolean;
}

export function FeaturedUnitsSection({ rooms, loading }: FeaturedUnitsSectionProps) {
  if (loading || rooms.length === 0) return null;

  return (
    <section id="featured-units" aria-label="Available rooms" className="scroll-mt-20 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-fg">
            Rooms open now
          </h2>
          <p className="text-sm text-muted">
            Check size, what is included, and move-in costs, then book a viewing.
          </p>
        </div>

        <Link to="/properties?mode=vacant&tab=rooms" className="self-start sm:self-auto">
          <Button variant="secondary" size="md" className="h-9 rounded-xl">
            <span>View All Vacant Rooms</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {rooms.map((item) => {
          const { room } = item;
          return (
            <article
              key={room.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-edge bg-card shadow-card transition-all duration-200 hover:border-edge-strong hover:shadow-pop"
            >
              {/* Unit Image */}
              <Link
                to={`/rooms/${room.id}`}
                className="relative block h-48 w-full overflow-hidden bg-inset border-b border-edge"
              >
                {item.previewPhotoUrl ? (
                  <img
                    src={item.previewPhotoUrl}
                    alt={`Room ${room.room_number} at ${item.propertyName}`}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <ListingMediaPlaceholder
                    kind="room"
                    label={`Room ${room.room_number}`}
                    className="h-full w-full"
                  />
                )}

                <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-success-border/80 bg-card/95 px-2.5 py-0.5 text-[11px] font-semibold text-success-fg shadow-soft backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-success-fg" />
                  Vacant
                </span>

                <span className="absolute right-3 top-3 rounded-full bg-card/92 px-2.5 py-0.5 text-[11px] font-semibold text-fg shadow-soft backdrop-blur-sm">
                  {item.propertyCity}
                </span>
              </Link>

              {/* Card Body */}
              <div className="flex flex-1 flex-col justify-between p-4 sm:p-5 space-y-4">
                <div className="space-y-1.5">
                  <p className="text-lg font-extrabold text-accent tabular-nums">
                    {formatCurrency(room.rent)}
                    <span className="text-xs font-medium text-muted"> / Month</span>
                  </p>

                  <Link
                    to={`/rooms/${room.id}`}
                    className="block text-base font-bold tracking-tight text-fg hover:text-accent transition-colors line-clamp-1"
                  >
                    Room {room.room_number} · {item.propertyName}
                  </Link>

                  <p className="flex items-center gap-1 text-xs text-muted">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-faint" />
                    <span className="truncate">
                      {item.propertyAddress}, {item.propertyCity}
                    </span>
                  </p>
                </div>

                {/* Metadata Footer Strip */}
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 border-t border-edge pt-3 text-[11px] font-medium text-fg-soft">
                    <span className="inline-flex items-center gap-1 truncate">
                      <Users className="h-3.5 w-3.5 shrink-0 text-muted" />
                      <span className="truncate">
                        {room.capacity} {room.capacity === 1 ? "Person" : "Persons"}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1 truncate tabular-nums">
                      <Maximize2 className="h-3.5 w-3.5 shrink-0 text-muted" />
                      <span className="truncate">
                        {room.floor_area != null ? `${room.floor_area} sqm` : "Standard"}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1 truncate tabular-nums">
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-muted" />
                      <span className="truncate">
                        {room.advance_months}+{room.deposit_months} mo
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link to={`/rooms/${room.id}`} className="flex-1">
                      <Button variant="secondary" size="sm" className="w-full h-9 rounded-xl">
                        View Details
                      </Button>
                    </Link>
                    <Link to={`/register?room=${room.id}`} className="flex-1">
                      <Button variant="primary" size="sm" className="w-full h-9 rounded-xl font-semibold">
                        <span>Apply</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
