import { useState, useEffect, type FormEvent } from "react";
import { useSearchParams } from "react-router";
import { useAuth } from "@/lib/auth-context";
import { listingsService } from "@/lib/services/listings";
import { propertiesService } from "@/lib/services/properties";
import {
  clearProspectDraft,
  loadProspectDraft,
} from "@/components/features/listings";
import { getErrorMessage } from "@/lib/errors";
import type { PublicRoom } from "@/lib/types";

export function useRegister() {
  const { register } = useAuth();
  const [searchParams] = useSearchParams();
  const preselectedRoomId = searchParams.get("room") || "";

  const [submitted, setSubmitted] = useState<{
    name: string;
    room: string;
    propertyName?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Preselected room loaded from /public/rooms/:id when arriving via "Apply for Unit"
  const [selectedPublicRoom, setSelectedPublicRoom] = useState<PublicRoom | null>(null);
  const [loadingSelectedRoom, setLoadingSelectedRoom] = useState(Boolean(preselectedRoomId));

  // Fallback walk-in selector state when arriving at /register directly
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [rooms, setRooms] = useState<{ id: string; room_number: string; rent: number }[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  const [inquiryId, setInquiryId] = useState<string | undefined>(undefined);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    property_id: "",
    room_number: "",
    password: "",
    password_confirmation: "",
  });

  // Pre-populate contact details if the prospect previously submitted a viewing inquiry
  useEffect(() => {
    const draft = loadProspectDraft();
    if (draft) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || draft.name || "",
        phone: prev.phone || draft.phone || "",
        email: prev.email || draft.email || "",
      }));
      if (draft.inquiry_id) {
        setInquiryId(draft.inquiry_id);
      }
    }
  }, []);

  // Mode A: Arrived from a specific room listing (?room=ID)
  useEffect(() => {
    if (!preselectedRoomId) {
      setSelectedPublicRoom(null);
      setLoadingSelectedRoom(false);
      return;
    }

    setLoadingSelectedRoom(true);
    setError("");
    listingsService
      .getPublicRoom(preselectedRoomId)
      .then((room) => {
        setSelectedPublicRoom(room);
        setFormData((prev) => ({
          ...prev,
          property_id: room.property_id,
          room_number: room.room_number,
        }));
      })
      .catch((err) => {
        setSelectedPublicRoom(null);
        setError(
          getErrorMessage(
            err,
            "The selected unit could not be loaded. Please choose an available unit below."
          )
        );
      })
      .finally(() => {
        setLoadingSelectedRoom(false);
      });
  }, [preselectedRoomId]);

  // Mode B: Walk-in applicant without a preselected room
  useEffect(() => {
    if (preselectedRoomId) return;

    propertiesService
      .getProperties()
      .then((res) => {
        if (res && res.length > 0) {
          setProperties(res);
          setFormData((prev) => ({
            ...prev,
            property_id: prev.property_id || String(res[0].id),
          }));
        }
      })
      .catch(() => {});
  }, [preselectedRoomId]);

  useEffect(() => {
    if (preselectedRoomId || !formData.property_id) return;

    setLoadingRooms(true);
    propertiesService
      .getRooms({ property_id: formData.property_id, status: "vacant", is_listed: true })
      .then((res) => {
        const vacantRooms = res || [];
        setRooms(vacantRooms);
        setFormData((prev) => ({
          ...prev,
          room_number: vacantRooms.length > 0 ? vacantRooms[0].room_number : "",
        }));
      })
      .catch(() => {
        setRooms([]);
        setFormData((prev) => ({ ...prev, room_number: "" }));
      })
      .finally(() => {
        setLoadingRooms(false);
      });
  }, [preselectedRoomId, formData.property_id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (selectedPublicRoom) {
      if (!selectedPublicRoom.is_available) {
        setError("This unit is no longer vacant. Please browse other available rooms.");
        setLoading(false);
        return;
      }
    } else if (!formData.room_number || rooms.length === 0) {
      setError(
        "There are no available vacant rooms in the selected building. Please browse another property."
      );
      setLoading(false);
      return;
    }

    if (formData.password !== formData.password_confirmation) {
      setError("Passwords do not match. Please re-enter.");
      setLoading(false);
      return;
    }

    try {
      const res = await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
        room_id: selectedPublicRoom?.id,
        property_id: formData.property_id,
        room_number: formData.room_number,
        inquiry_id: inquiryId,
      });

      clearProspectDraft();
      setSubmitted({
        name: res.tenant.name,
        room: res.tenant.room,
        propertyName: selectedPublicRoom?.property?.name,
      });
    } catch (err) {
      setError(getErrorMessage(err, "Unable to submit your application. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return {
    submitted,
    loading,
    error,
    selectedPublicRoom,
    loadingSelectedRoom,
    properties,
    rooms,
    loadingRooms,
    formData,
    setFormData,
    handleSubmit,
  };
}
