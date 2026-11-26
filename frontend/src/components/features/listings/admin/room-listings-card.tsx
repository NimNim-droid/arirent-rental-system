import { useRef } from "react";
import { Link } from "react-router";
import { DoorOpen, Edit2, Eye, EyeOff, ImagePlus, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/formatters";
import type { ListingPhoto, Room } from "@/lib/types";

interface RoomListingsCardProps {
  rooms: Room[];
  uploadingTarget: string | null;
  onUploadRoomPhotos: (files: FileList | null, roomId: string) => void;
  onSetCoverPhoto: (photo: ListingPhoto) => void;
  onDeletePhoto: (photo: ListingPhoto) => void;
  onEditRoom: (room: Room) => void;
  onToggleRoomListed: (room: Room) => void;
}

export function RoomListingsCard({
  rooms,
  uploadingTarget,
  onUploadRoomPhotos,
  onSetCoverPhoto,
  onDeletePhoto,
  onEditRoom,
  onToggleRoomListed,
}: RoomListingsCardProps) {
  const roomFileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  return (
    <Card className="p-5 sm:p-6 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-fg">
          3. Individual Units &amp; Room Photos ({rooms.length})
        </h2>
        <p className="text-xs text-muted">
          Vacant units with &ldquo;Listed&rdquo; enabled automatically appear for online viewing and
          applications. When a tenant vacates later, the unit automatically re-lists.
        </p>
      </div>

      {rooms.length === 0 ? (
        <EmptyState
          icon={<DoorOpen className="h-4 w-4" />}
          title="No units added to this building yet"
          description="Add rooms on the Properties & Units page first, then upload their photos and inclusions here."
          action={
            <Link to="/admin/properties">
              <Button size="sm">Go to Properties &amp; Units</Button>
            </Link>
          }
        />
      ) : (
        <div className="divide-y divide-edge border-t border-edge">
          {rooms.map((room) => {
            const roomPhotos = room.photos ?? [];
            const isListed = room.is_listed !== false;

            return (
              <div key={room.id} className="py-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-fg">
                        Room {room.room_number}
                      </span>
                      <span className="text-sm font-bold text-fg tabular-nums">
                        {formatCurrency(room.rent)}/mo
                      </span>
                      <Badge
                        variant={
                          room.status === "vacant"
                            ? "success"
                            : room.status === "reserved"
                            ? "warning"
                            : "neutral"
                        }
                      >
                        {room.status}
                      </Badge>
                      <Badge variant={isListed ? "info" : "neutral"}>
                        {isListed ? "Listed publicly" : "Hidden from public"}
                      </Badge>
                    </div>

                    <p className="text-xs text-muted">
                      Capacity: {room.capacity ?? 1} &middot;{" "}
                      {room.floor_area != null ? `${room.floor_area} sqm · ` : ""}
                      {room.advance_months ?? 1} mo advance, {room.deposit_months ?? 1} mo deposit
                      {(room.amenities?.length ?? 0) > 0 ? ` · ${room.amenities!.join(", ")}` : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={(el) => {
                        roomFileRefs.current[room.id] = el;
                      }}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        onUploadRoomPhotos(e.target.files, room.id);
                        e.target.value = "";
                      }}
                    />

                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      loading={uploadingTarget === `room-${room.id}`}
                      onClick={() => roomFileRefs.current[room.id]?.click()}
                    >
                      <ImagePlus className="h-3.5 w-3.5" />
                      Add Photos
                    </Button>

                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => onEditRoom(room)}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit Inclusions
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleRoomListed(room)}
                    >
                      {isListed ? (
                        <>
                          <EyeOff className="h-3.5 w-3.5" />
                          Hide
                        </>
                      ) : (
                        <>
                          <Eye className="h-3.5 w-3.5" />
                          Publish
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {roomPhotos.length > 0 && (
                  <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                    {roomPhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className="relative h-20 w-28 shrink-0 overflow-hidden rounded-md border border-edge bg-inset group"
                      >
                        <img
                          src={photo.url || ""}
                          alt={`Room ${room.room_number}`}
                          className="h-full w-full object-cover"
                        />
                        {photo.is_cover && (
                          <span className="absolute left-1 top-1 rounded bg-card/90 px-1 py-0.5 text-[9px] font-semibold text-fg">
                            Cover
                          </span>
                        )}
                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-slate-950/75 px-1.5 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          {!photo.is_cover ? (
                            <button
                              type="button"
                              onClick={() => onSetCoverPhoto(photo)}
                              className="hover:underline cursor-pointer"
                            >
                              Cover
                            </button>
                          ) : (
                            <span>Main</span>
                          )}
                          <button
                            type="button"
                            onClick={() => onDeletePhoto(photo)}
                            className="text-rose-300 hover:text-rose-200 cursor-pointer"
                            title="Remove photo"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
