import { Link } from "react-router";
import { ChevronRight, DoorOpen, MapPin, Maximize2, Users } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import type { FeaturedPublicRoom } from "./listing-helpers";

interface PublicRoomRowCardProps {
  item: FeaturedPublicRoom;
}

/**
 * Compact horizontal room row card for quickly scanning many vacant rooms on phones.
 */
export function PublicRoomRowCard({ item }: PublicRoomRowCardProps) {
  const { room } = item;

  return (
    <Link
      to={`/rooms/${room.id}`}
      className="flex items-stretch gap-3 rounded-2xl border border-edge bg-card p-2.5 shadow-card transition-all hover:border-edge-strong active:scale-[0.99]"
    >
      {/* Square Thumbnail */}
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-edge bg-inset">
        {item.previewPhotoUrl ? (
          <img
            src={item.previewPhotoUrl}
            alt={`Room ${room.room_number} at ${item.propertyName}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-faint">
            <DoorOpen className="h-5 w-5" />
            <span className="text-[10px] font-medium text-muted">Room {room.room_number}</span>
          </div>
        )}

        <span className="absolute left-1.5 bottom-1.5 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow-soft">
          Vacant
        </span>
      </div>

      {/* Room Summary */}
      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-tight text-fg">
            Room {room.room_number} &mdash; {item.propertyName}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
            <MapPin className="h-3 w-3 shrink-0 text-faint" />
            <span className="truncate">
              {item.propertyAddress}, {item.propertyCity}
            </span>
          </p>
        </div>

        <div className="flex items-end justify-between gap-2 pt-1.5">
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-accent tabular-nums leading-tight">
              {formatCurrency(room.rent)}
              <span className="text-[11px] font-medium text-muted">/mo</span>
            </p>
            <div className="mt-1 flex items-center gap-2.5 text-[11px] text-muted tabular-nums">
              <span className="inline-flex items-center gap-1">
                <Users className="h-3 w-3 text-faint" />
                {room.capacity} {room.capacity === 1 ? "person" : "persons"}
              </span>
              {room.floor_area != null && (
                <span className="inline-flex items-center gap-1">
                  <Maximize2 className="h-3 w-3 text-faint" />
                  {room.floor_area} sqm
                </span>
              )}
            </div>
          </div>

          <span className="inline-flex items-center gap-0.5 rounded-lg bg-accent-soft px-2 py-1 text-[11px] font-semibold text-accent shrink-0">
            <span>Inspect</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
