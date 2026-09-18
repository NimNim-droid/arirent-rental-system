import { useCallback, useEffect, useMemo, useState } from "react";
import { propertiesService } from "@/lib/services/properties";
import { getErrorMessage } from "@/lib/errors";
import type { Property, Room } from "@/lib/types";

export function useProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Filters
  const [selectedPropertyFilter, setSelectedPropertyFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
  const [isEditPropertyOpen, setIsEditPropertyOpen] = useState(false);
  const [propertyToEdit, setPropertyToEdit] = useState<Property | null>(null);
  const [isDeletePropertyOpen, setIsDeletePropertyOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);

  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [isEditRoomOpen, setIsEditRoomOpen] = useState(false);
  const [roomToEdit, setRoomToEdit] = useState<Room | null>(null);
  const [isDeleteRoomOpen, setIsDeleteRoomOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);

  // Forms state
  const [propertyForm, setPropertyForm] = useState({
    name: "",
    city: "",
    address: "",
  });

  const [roomForm, setRoomForm] = useState({
    property_id: "",
    room_number: "",
    rent: "",
    status: "vacant" as "vacant" | "reserved" | "occupied",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [propsData, roomsData] = await Promise.all([
        propertiesService.getProperties(),
        propertiesService.getRooms(),
      ]);
      setProperties(propsData);
      setRooms(roomsData);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load properties and rooms data."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Temporary success banner clear
  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(""), 4000);
    return () => clearTimeout(t);
  }, [successMsg]);

  // Overall KPI Calculations
  const stats = useMemo(() => {
    const totalProps = properties.length;
    const totalRooms = rooms.length;
    const vacantRooms = rooms.filter((r) => r.status === "vacant").length;
    const occupiedRooms = rooms.filter((r) => r.status === "occupied").length;
    const reservedRooms = rooms.filter((r) => r.status === "reserved").length;
    const occupancyRate =
      totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    return {
      totalProps,
      totalRooms,
      vacantRooms,
      occupiedRooms,
      reservedRooms,
      occupancyRate,
    };
  }, [properties, rooms]);

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      if (selectedPropertyFilter !== "all" && room.property_id !== selectedPropertyFilter) {
        return false;
      }
      if (selectedStatusFilter !== "all" && room.status !== selectedStatusFilter) {
        return false;
      }
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const matchesRoom = room.room_number.toLowerCase().includes(q);
        const matchesProp = room.property?.name.toLowerCase().includes(q) ?? false;
        if (!matchesRoom && !matchesProp) return false;
      }
      return true;
    });
  }, [rooms, selectedPropertyFilter, selectedStatusFilter, searchQuery]);

  // Property Handlers
  const openAddProperty = () => {
    setPropertyForm({ name: "", city: "", address: "" });
    setError("");
    setIsAddPropertyOpen(true);
  };

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyForm.name || !propertyForm.city || !propertyForm.address) {
      setError("Please complete all property fields.");
      return;
    }

    setActionLoading(true);
    setError("");
    try {
      const newProp = await propertiesService.createProperty(propertyForm);
      setProperties((prev) => [newProp, ...prev]);
      setSuccessMsg(`Property "${propertyForm.name}" created successfully.`);
      setIsAddPropertyOpen(false);
      loadData();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create property."));
    } finally {
      setActionLoading(false);
    }
  };

  const openEditProperty = (prop: Property) => {
    setPropertyToEdit(prop);
    setPropertyForm({
      name: prop.name,
      city: prop.city,
      address: prop.address,
    });
    setError("");
    setIsEditPropertyOpen(true);
  };

  const handleUpdateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyToEdit) return;

    setActionLoading(true);
    setError("");
    try {
      const updated = await propertiesService.updateProperty(propertyToEdit.id, propertyForm);
      setProperties((prev) =>
        prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
      );
      setSuccessMsg(`Property "${propertyForm.name}" updated successfully.`);
      setIsEditPropertyOpen(false);
      setPropertyToEdit(null);
      loadData();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update property."));
    } finally {
      setActionLoading(false);
    }
  };

  const openDeleteProperty = (prop: Property) => {
    setPropertyToDelete(prop);
    setError("");
    setIsDeletePropertyOpen(true);
  };

  const handleDeleteProperty = async () => {
    if (!propertyToDelete) return;

    setActionLoading(true);
    setError("");
    try {
      await propertiesService.deleteProperty(propertyToDelete.id);
      setProperties((prev) => prev.filter((p) => p.id !== propertyToDelete.id));
      setSuccessMsg(`Property "${propertyToDelete.name}" deleted successfully.`);
      setIsDeletePropertyOpen(false);
      setPropertyToDelete(null);
      loadData();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete property."));
    } finally {
      setActionLoading(false);
    }
  };

  // Room Handlers
  const openAddRoom = (defaultPropertyId?: string) => {
    const propId =
      defaultPropertyId ||
      (selectedPropertyFilter !== "all"
        ? selectedPropertyFilter
        : properties[0]?.id || "");

    setRoomForm({
      property_id: propId,
      room_number: "",
      rent: "",
      status: "vacant",
    });
    setError("");
    setIsAddRoomOpen(true);
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomForm.property_id || !roomForm.room_number || !roomForm.rent) {
      setError("Please complete all room fields.");
      return;
    }

    const rentNum = parseFloat(roomForm.rent);
    if (isNaN(rentNum) || rentNum < 0) {
      setError("Rent must be a valid positive amount.");
      return;
    }

    setActionLoading(true);
    setError("");
    try {
      const newRoom = await propertiesService.createRoom({
        property_id: roomForm.property_id,
        room_number: roomForm.room_number.trim(),
        rent: rentNum,
        status: roomForm.status,
      });
      setRooms((prev) => [newRoom, ...prev]);
      setSuccessMsg(`Room "${roomForm.room_number}" added successfully.`);
      setIsAddRoomOpen(false);
      loadData();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to add room."));
    } finally {
      setActionLoading(false);
    }
  };

  const openEditRoom = (room: Room) => {
    setRoomToEdit(room);
    setRoomForm({
      property_id: room.property_id,
      room_number: room.room_number,
      rent: String(room.rent),
      status: room.status,
    });
    setError("");
    setIsEditRoomOpen(true);
  };

  const handleUpdateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomToEdit) return;

    const rentNum = parseFloat(roomForm.rent);
    if (isNaN(rentNum) || rentNum < 0) {
      setError("Rent must be a valid positive amount.");
      return;
    }

    setActionLoading(true);
    setError("");
    try {
      const updated = await propertiesService.updateRoom(roomToEdit.id, {
        room_number: roomForm.room_number.trim(),
        rent: rentNum,
        status: roomForm.status,
      });
      setRooms((prev) =>
        prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r))
      );
      setSuccessMsg(`Room "${roomForm.room_number}" updated successfully.`);
      setIsEditRoomOpen(false);
      setRoomToEdit(null);
      loadData();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update room."));
    } finally {
      setActionLoading(false);
    }
  };

  const openDeleteRoom = (room: Room) => {
    setRoomToDelete(room);
    setError("");
    setIsDeleteRoomOpen(true);
  };

  const handleDeleteRoom = async () => {
    if (!roomToDelete) return;

    setActionLoading(true);
    setError("");
    try {
      await propertiesService.deleteRoom(roomToDelete.id);
      setRooms((prev) => prev.filter((r) => r.id !== roomToDelete.id));
      setSuccessMsg(`Room "${roomToDelete.room_number}" deleted successfully.`);
      setIsDeleteRoomOpen(false);
      setRoomToDelete(null);
      loadData();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete room."));
    } finally {
      setActionLoading(false);
    }
  };

  return {
    properties,
    rooms,
    filteredRooms,
    loading,
    actionLoading,
    error,
    successMsg,
    stats,
    selectedPropertyFilter,
    selectedStatusFilter,
    searchQuery,
    setSelectedPropertyFilter,
    setSelectedStatusFilter,
    setSearchQuery,
    loadData,
    setError,
    setSuccessMsg,
    // Property modal states & form
    isAddPropertyOpen,
    setIsAddPropertyOpen,
    isEditPropertyOpen,
    setIsEditPropertyOpen,
    propertyToEdit,
    isDeletePropertyOpen,
    setIsDeletePropertyOpen,
    propertyToDelete,
    propertyForm,
    setPropertyForm,
    openAddProperty,
    handleCreateProperty,
    openEditProperty,
    handleUpdateProperty,
    openDeleteProperty,
    handleDeleteProperty,
    // Room modal states & form
    isAddRoomOpen,
    setIsAddRoomOpen,
    isEditRoomOpen,
    setIsEditRoomOpen,
    roomToEdit,
    isDeleteRoomOpen,
    setIsDeleteRoomOpen,
    roomToDelete,
    roomForm,
    setRoomForm,
    openAddRoom,
    handleCreateRoom,
    openEditRoom,
    handleUpdateRoom,
    openDeleteRoom,
    handleDeleteRoom,
  };
}
