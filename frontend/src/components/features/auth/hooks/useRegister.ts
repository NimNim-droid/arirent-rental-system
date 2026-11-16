import { useState, useEffect, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { propertiesService } from "@/lib/services/properties";
import { getErrorMessage } from "@/lib/errors";

export function useRegister() {
  const { register } = useAuth();
  const [submitted, setSubmitted] = useState<{ name: string; room: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [rooms, setRooms] = useState<{ id: string; room_number: string; rent: number }[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    property_id: "",
    room_number: "",
    password: "",
    password_confirmation: "",
  });

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (!formData.property_id) return;
    setLoadingRooms(true);
    propertiesService
      .getRooms({ property_id: formData.property_id, status: "vacant" })
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
  }, [formData.property_id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.room_number || rooms.length === 0) {
      setError(
        "There are no available vacant rooms in the selected building. Please choose another property."
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
      const res = await register(formData);
      setSubmitted({ name: res.tenant.name, room: res.tenant.room });
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
    properties,
    rooms,
    loadingRooms,
    formData,
    setFormData,
    handleSubmit,
  };
}

