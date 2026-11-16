import { useState, useEffect, type FormEvent } from "react";
import { propertiesService } from "@/lib/services/properties";
import { authService } from "@/lib/services/auth";
import { getErrorMessage } from "@/lib/errors";
import type { Property, Room } from "@/lib/types";

interface UseAddTenantFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function useAddTenantForm({ open, onClose, onSuccess }: UseAddTenantFormProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [selectedRoomNumber, setSelectedRoomNumber] = useState("");

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("Tenant123!");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      void propertiesService.getProperties().then((props) => {
        setProperties(props);
        if (props.length > 0) {
          setSelectedPropertyId(props[0].id);
        }
      });
      setName("");
      setUsername("");
      setEmail("");
      setPhone("");
      setError("");
    }
  }, [open]);

  useEffect(() => {
    if (selectedPropertyId) {
      void propertiesService
        .getRooms({ property_id: selectedPropertyId, status: "vacant" })
        .then((r) => {
          setRooms(r);
          if (r.length > 0) {
            setSelectedRoomNumber(r[0].room_number);
          } else {
            setSelectedRoomNumber("");
          }
        });
    }
  }, [selectedPropertyId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPropertyId) {
      setError("Please select a property.");
      return;
    }
    if (!selectedRoomNumber) {
      setError("Please select an available vacant room.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await authService.register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        password_confirmation: password,
        property_id: selectedPropertyId,
        room_number: selectedRoomNumber,
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to register tenant."));
    } finally {
      setLoading(false);
    }
  };

  return {
    properties,
    rooms,
    selectedPropertyId,
    setSelectedPropertyId,
    selectedRoomNumber,
    setSelectedRoomNumber,
    name,
    setName,
    username,
    setUsername,
    email,
    setEmail,
    phone,
    setPhone,
    password,
    setPassword,
    loading,
    error,
    handleSubmit,
  };
}

