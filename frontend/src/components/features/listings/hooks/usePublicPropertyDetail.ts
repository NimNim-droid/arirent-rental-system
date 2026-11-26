import { useCallback, useEffect, useMemo, useState } from "react";
import { listingsService } from "@/lib/services/listings";
import { getErrorMessage } from "@/lib/errors";
import type { ListingPhoto, PublicProperty, PublicRoom } from "@/lib/types";

export function usePublicPropertyDetail(id?: string) {
  const [property, setProperty] = useState<PublicProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unitFilter, setUnitFilter] = useState<"available" | "all">("available");
  const [visitOpen, setVisitOpen] = useState(false);
  const [selectedRoomForVisit, setSelectedRoomForVisit] = useState<PublicRoom | null>(null);

  const loadProperty = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const data = await listingsService.getPublicProperty(id);
      setProperty(data);
    } catch (err) {
      setError(getErrorMessage(err, "Property listing could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProperty();
  }, [loadProperty]);

  const galleryPhotos = useMemo<ListingPhoto[]>(() => {
    if (!property) return [];
    if (property.photos.length > 0) return property.photos;
    return property.rooms.flatMap((r) => r.photos);
  }, [property]);

  const displayedRooms = useMemo(() => {
    if (!property) return [];
    if (unitFilter === "available") {
      const vacant = property.rooms.filter((r) => r.is_available);
      return vacant.length > 0 ? vacant : property.rooms;
    }
    return property.rooms;
  }, [property, unitFilter]);

  const openVisitForRoom = (room: PublicRoom | null) => {
    setSelectedRoomForVisit(room);
    setVisitOpen(true);
  };

  return {
    property,
    loading,
    error,
    unitFilter,
    setUnitFilter,
    visitOpen,
    setVisitOpen,
    selectedRoomForVisit,
    galleryPhotos,
    displayedRooms,
    openVisitForRoom,
  };
}
