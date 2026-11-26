import { Link } from "react-router";
import { ArrowRight, Calendar, DoorOpen, Maximize2, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListingMediaPlaceholder } from "./listing-media-placeholder";
import { formatCurrency } from "@/lib/formatters";
import type { PublicRoom } from "@/lib/types";

interface PublicUnitListProps {
  propertyName: string;
  allRoomsCount: number;
  vacantCount: number;
  displayedRooms: PublicRoom[];
  unitFilter: "available" | "all";
  onUnitFilterChange: (filter: "available" | "all") => void;
  onScheduleVisit: (room: PublicRoom) => void;
}

export function PublicUnitList({
  propertyName,
  allRoomsCount,
  vacantCount,
  displayedRooms,
  unitFilter,
  onUnitFilterChange,
  onScheduleVisit,
}: PublicUnitListProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-fg">Units in {propertyName}</h2>
          <p className="text-xs text-muted">
            Inspect unit specifications, photos, and move-in requirements before applying
          </p>
        </div>

        {allRoomsCount > vacantCount && vacantCount > 0 && (
          <div className="inline-flex rounded-md border border-edge bg-card p-0.5 self-start">
            <button
              type="button"
              onClick={() => onUnitFilterChange("available")}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                unitFilter === "available" ? "bg-hover text-fg" : "text-muted hover:text-fg"
              }`}
            >
              Vacant ({vacantCount})
            </button>
            <button
              type="button"
              onClick={() => onUnitFilterChange("all")}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                unitFilter === "all" ? "bg-hover text-fg" : "text-muted hover:text-fg"
              }`}
            >
              All Listed ({allRoomsCount})
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {displayedRooms.map((room) => (
          <Card key={room.id} className="overflow-hidden hover:border-edge-strong transition-colors">
            <div className="flex flex-col sm:flex-row">
              <Link
                to={`/rooms/${room.id}`}
                className="sm:w-48 h-40 sm:h-auto shrink-0 overflow-hidden bg-inset border-b sm:border-b-0 sm:border-r border-edge"
              >
                {room.cover_photo_url ? (
                  <img
                    src={room.cover_photo_url}
                    alt={`Room ${room.room_number}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ListingMediaPlaceholder
                    kind="room"
                    label={`Room ${room.room_number}`}
                    className="h-full w-full min-h-[140px]"
                  />
                )}
              </Link>

              <div className="flex flex-1 flex-col justify-between p-4 sm:p-5 gap-3">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/rooms/${room.id}`}
                          className="text-base font-semibold text-fg hover:text-accent transition-colors"
                        >
                          Room {room.room_number}
                        </Link>
                        {room.is_available ? (
                          <Badge variant="success" dot>
                            Vacant
                          </Badge>
                        ) : room.status === "reserved" ? (
                          <Badge variant="warning">Reserved</Badge>
                        ) : (
                          <Badge variant="neutral">Currently Leased</Badge>
                        )}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted">
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          Up to {room.capacity} {room.capacity === 1 ? "person" : "persons"}
                        </span>
                        {room.floor_area != null && (
                          <span className="inline-flex items-center gap-1 tabular-nums">
                            <Maximize2 className="h-3.5 w-3.5" />
                            {room.floor_area} sqm
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 tabular-nums">
                          <DoorOpen className="h-3.5 w-3.5" />
                          {room.advance_months} mo advance &middot; {room.deposit_months} mo deposit
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-base font-extrabold text-accent tabular-nums">
                        {formatCurrency(room.rent)}
                      </p>
                      <p className="text-[11px] text-muted">per month</p>
                    </div>
                  </div>

                  {room.description && (
                    <p className="text-xs text-fg-soft leading-relaxed line-clamp-2">
                      {room.description}
                    </p>
                  )}

                  {room.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {room.amenities.slice(0, 5).map((item) => (
                        <span
                          key={item}
                          className="rounded border border-edge bg-inset px-2 py-0.5 text-[11px] text-fg-soft"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 border-t border-edge pt-3">
                  <Link to={`/rooms/${room.id}`}>
                    <Button variant="ghost" size="sm">
                      Unit Details
                    </Button>
                  </Link>

                  {room.is_available && (
                    <>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => onScheduleVisit(room)}
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        Schedule Visit
                      </Button>
                      <Link to={`/register?room=${room.id}`}>
                        <Button size="sm" variant="primary">
                          Apply for Unit
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
