import { useCallback, useEffect, useState, type FormEvent } from "react";
import { listingsService } from "@/lib/services/listings";
import { propertiesService } from "@/lib/services/properties";
import { getErrorMessage } from "@/lib/errors";
import type { ListingPhoto, Property, Room } from "@/lib/types";

export function useAdminPropertyListing(id?: string) {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);
  const [photoActionId, setPhotoActionId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [profileForm, setProfileForm] = useState({
    name: "",
    city: "",
    address: "",
    description: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    messenger_url: "",
    house_rules: "",
    amenities: [] as string[],
  });
  const [customBuildingAmenity, setCustomBuildingAmenity] = useState("");

  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [savingRoom, setSavingRoom] = useState(false);
  const [customRoomAmenity, setCustomRoomAmenity] = useState("");
  const [roomForm, setRoomForm] = useState({
    rent: "",
    capacity: "1",
    floor_area: "",
    advance_months: "1",
    deposit_months: "1",
    description: "",
    amenities: [] as string[],
    is_listed: true,
  });

  const loadListing = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const data = await listingsService.getAdminPropertyListing(id);
      setProperty(data);
      setProfileForm({
        name: data.name || "",
        city: data.city || "",
        address: data.address || "",
        description: data.description || "",
        contact_name: data.contact_name || "",
        contact_phone: data.contact_phone || "",
        contact_email: data.contact_email || "",
        messenger_url: data.messenger_url || "",
        house_rules: data.house_rules || "",
        amenities: data.amenities ?? [],
      });
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load building listing details."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadListing();
  }, [loadListing]);

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(""), 4000);
    return () => clearTimeout(t);
  }, [successMsg]);

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!property) return;

    setSavingProfile(true);
    setError("");
    try {
      await propertiesService.updateProperty(property.id, {
        name: profileForm.name.trim(),
        city: profileForm.city.trim(),
        address: profileForm.address.trim(),
        description: profileForm.description.trim() || null,
        contact_name: profileForm.contact_name.trim() || null,
        contact_phone: profileForm.contact_phone.trim() || null,
        contact_email: profileForm.contact_email.trim() || null,
        messenger_url: profileForm.messenger_url.trim() || null,
        house_rules: profileForm.house_rules.trim() || null,
        amenities: profileForm.amenities,
      });
      setSuccessMsg("Public building details and contact info saved.");
      await loadListing();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to save building listing profile."));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUploadPhotos = async (files: FileList | null, roomId?: string) => {
    if (!property || !files || files.length === 0) return;
    const targetKey = roomId ? `room-${roomId}` : "building";
    setUploadingTarget(targetKey);
    setError("");

    try {
      await listingsService.uploadPhotos(property.id, Array.from(files), roomId ?? null);
      setSuccessMsg(roomId ? "Unit photos uploaded." : "Building photos uploaded.");
      await loadListing();
    } catch (err) {
      setError(getErrorMessage(err, "Photo upload failed. Please check the file format and size."));
    } finally {
      setUploadingTarget(null);
    }
  };

  const handleSetCover = async (photo: ListingPhoto) => {
    setPhotoActionId(photo.id);
    setError("");
    try {
      await listingsService.setCoverPhoto(photo.id);
      setSuccessMsg("Cover photo updated.");
      await loadListing();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to set cover photo."));
    } finally {
      setPhotoActionId(null);
    }
  };

  const handleDeletePhoto = async (photo: ListingPhoto) => {
    setPhotoActionId(photo.id);
    setError("");
    try {
      await listingsService.deletePhoto(photo.id);
      setSuccessMsg("Photo removed.");
      await loadListing();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to remove photo."));
    } finally {
      setPhotoActionId(null);
    }
  };

  const handleToggleRoomListed = async (room: Room) => {
    setError("");
    const nextListed = room.is_listed === false;
    try {
      await propertiesService.updateRoom(room.id, { is_listed: nextListed });
      setSuccessMsg(
        nextListed
          ? `Room ${room.room_number} is now visible on the public listing.`
          : `Room ${room.room_number} hidden from the public listing.`
      );
      await loadListing();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to update room visibility."));
    }
  };

  const openRoomEditor = (room: Room) => {
    setEditingRoom(room);
    setCustomRoomAmenity("");
    setRoomForm({
      rent: String(room.rent ?? ""),
      capacity: String(room.capacity ?? 1),
      floor_area: room.floor_area != null ? String(room.floor_area) : "",
      advance_months: String(room.advance_months ?? 1),
      deposit_months: String(room.deposit_months ?? 1),
      description: room.description ?? "",
      amenities: room.amenities ?? [],
      is_listed: room.is_listed !== false,
    });
  };

  const handleSaveRoom = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;

    setSavingRoom(true);
    setError("");
    try {
      await propertiesService.updateRoom(editingRoom.id, {
        rent: Number(roomForm.rent) || 0,
        capacity: Math.max(1, parseInt(roomForm.capacity, 10) || 1),
        floor_area: roomForm.floor_area.trim() ? Number(roomForm.floor_area) : null,
        advance_months: Math.max(0, parseInt(roomForm.advance_months, 10) || 0),
        deposit_months: Math.max(0, parseInt(roomForm.deposit_months, 10) || 0),
        description: roomForm.description.trim() || null,
        amenities: roomForm.amenities,
        is_listed: roomForm.is_listed,
      });
      setSuccessMsg(`Listing details for Room ${editingRoom.room_number} saved.`);
      setEditingRoom(null);
      await loadListing();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to save unit listing details."));
    } finally {
      setSavingRoom(false);
    }
  };

  return {
    property,
    loading,
    savingProfile,
    uploadingTarget,
    photoActionId,
    error,
    successMsg,
    profileForm,
    setProfileForm,
    customBuildingAmenity,
    setCustomBuildingAmenity,
    editingRoom,
    setEditingRoom,
    savingRoom,
    customRoomAmenity,
    setCustomRoomAmenity,
    roomForm,
    setRoomForm,
    handleSaveProfile,
    handleUploadPhotos,
    handleSetCover,
    handleDeletePhoto,
    handleToggleRoomListed,
    openRoomEditor,
    handleSaveRoom,
  };
}
