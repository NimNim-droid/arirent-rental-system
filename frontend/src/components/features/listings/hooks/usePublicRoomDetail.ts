import { useCallback, useEffect, useMemo, useState } from "react";
import { listingsService } from "@/lib/services/listings";
import { getErrorMessage } from "@/lib/errors";
import type { ListingPhoto, PublicRoom } from "@/lib/types";

export function usePublicRoomDetail(id?: string) {
  const [room, setRoom] = useState<PublicRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [visitOpen, setVisitOpen] = useState(false);

  const loadRoom = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const data = await listingsService.getPublicRoom(id);
      setRoom(data);
    } catch (err) {
      setError(getErrorMessage(err, "Unit details could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadRoom();
  }, [loadRoom]);

  const combinedPhotos = useMemo<ListingPhoto[]>(() => {
    if (!room) return [];
    const buildingPhotos = room.property?.photos ?? [];
    return [...room.photos, ...buildingPhotos];
  }, [room]);

  return {
    room,
    loading,
    error,
    visitOpen,
    setVisitOpen,
    combinedPhotos,
  };
}
