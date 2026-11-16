import { useState, useEffect, type FormEvent } from "react";
import { propertiesService } from "@/lib/services/properties";
import { tenantsService } from "@/lib/services/tenants";
import { getErrorMessage } from "@/lib/errors";
import type { Room, Tenant } from "@/lib/types";

interface UseEditTenantFormProps {
  tenant: Tenant | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function useEditTenantForm({
  tenant,
  open,
  onClose,
  onSuccess,
}: UseEditTenantFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [room, setRoom] = useState("");
  const [waterRate, setWaterRate] = useState<number>(500);
  const [advancePaid, setAdvancePaid] = useState<number>(0);
  const [moveInDate, setMoveInDate] = useState("");
  const [leaseEnd, setLeaseEnd] = useState("");

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (tenant && open) {
      setName(tenant.name || "");
      setEmail(tenant.email || "");
      setPhone(tenant.phone || "");
      setRoom(tenant.room || "");
      setWaterRate(tenant.water_rate || 500);
      setAdvancePaid(tenant.advance_paid || 0);
      setMoveInDate(tenant.move_in_date ? tenant.move_in_date.split("T")[0] : "");
      setLeaseEnd(tenant.lease_end ? tenant.lease_end.split("T")[0] : "");
      setError("");
    }
  }, [tenant, open]);

  useEffect(() => {
    if (open && tenant?.property_id) {
      void propertiesService
        .getRooms({ property_id: String(tenant.property_id) })
        .then(setRooms)
        .catch(() => {});
    }
  }, [open, tenant]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    setLoading(true);
    setError("");

    try {
      await tenantsService.updateTenant(tenant.id, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        room: room.trim() || undefined,
        water_rate: Number(waterRate),
        advance_paid: Number(advancePaid),
        move_in_date: moveInDate || undefined,
        lease_end: leaseEnd || undefined,
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update tenant information."));
    } finally {
      setLoading(false);
    }
  };

  return {
    name,
    setName,
    email,
    setEmail,
    phone,
    setPhone,
    room,
    setRoom,
    waterRate,
    setWaterRate,
    advancePaid,
    setAdvancePaid,
    moveInDate,
    setMoveInDate,
    leaseEnd,
    setLeaseEnd,
    rooms,
    loading,
    error,
    handleSubmit,
  };
}

