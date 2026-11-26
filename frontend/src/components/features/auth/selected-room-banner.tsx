import { Link } from "react-router";
import { ArrowRight, MapPin, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ListingMediaPlaceholder } from "@/components/features/listings";
import { formatCurrency } from "@/lib/formatters";
import type { PublicRoom } from "@/lib/types";

interface SelectedRoomBannerProps {
  room: PublicRoom | null;
  loading: boolean;
}

export function SelectedRoomBanner({ room, loading }: SelectedRoomBannerProps) {
  if (loading) {
    return (
      <Card className="p-4 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-12 w-full" />
      </Card>
    );
  }

  if (!room) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-edge bg-card p-3.5 text-xs">
        <div className="min-w-0">
          <p className="font-semibold text-fg">Haven&apos;t inspected a unit yet?</p>
          <p className="text-muted mt-0.5">
            View room photos, rates, and book a visit with the landlord first.
          </p>
        </div>
        <Link to="/" className="shrink-0">
          <Button variant="secondary" size="sm">
            Browse Units
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-3.5 p-3.5">
        <div className="h-16 w-20 shrink-0 overflow-hidden rounded-md border border-edge bg-inset">
          {room.cover_photo_url ? (
            <img
              src={room.cover_photo_url}
              alt={`Room ${room.room_number}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <ListingMediaPlaceholder kind="room" label="Unit" className="h-full w-full" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-fg truncate">
              Room {room.room_number} &mdash; {room.property?.name}
            </span>
            <Badge variant={room.is_available ? "success" : "warning"}>
              {room.is_available ? "Vacant" : room.status}
            </Badge>
          </div>
          {room.property && (
            <p className="flex items-center gap-1 text-xs text-muted truncate">
              <MapPin className="h-3 w-3 shrink-0" />
              {room.property.address}, {room.property.city}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-xs">
            <span className="font-semibold text-fg tabular-nums">
              {formatCurrency(room.rent)}/mo &middot;{" "}
              <span className="font-normal text-muted">
                <Users className="inline h-3 w-3 mr-0.5" />
                Up to {room.capacity}
              </span>
            </span>
            <Link to={`/rooms/${room.id}`} className="font-medium text-accent hover:underline">
              View unit details
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
