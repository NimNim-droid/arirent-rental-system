import { useState, useEffect } from "react";
import { User, Building, Home, Mail, Phone, Calendar, Droplets, Banknote } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { AlertBanner } from "@/components/ui/alert-banner";
import { propertiesService } from "@/lib/services/properties";
import { tenantsService } from "@/lib/services/tenants";
import { getErrorMessage } from "@/lib/errors";
import type { Tenant, Property, Room } from "@/lib/types";

interface EditTenantModalProps {
  tenant: Tenant | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditTenantModal({
  tenant,
  open,
  onClose,
  onSuccess,
}: EditTenantModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [room, setRoom] = useState("");
  const [waterRate, setWaterRate] = useState<number>(500);
  const [advancePaid, setAdvancePaid] = useState<number>(0);
  const [moveInDate, setMoveInDate] = useState("");
  const [leaseEnd, setLeaseEnd] = useState("");

  const [properties, setProperties] = useState<Property[]>([]);
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
    if (open) {
      void propertiesService.getProperties().then(setProperties).catch(() => {});
      if (tenant?.property_id) {
        void propertiesService.getRooms({ property_id: String(tenant.property_id) }).then(setRooms).catch(() => {});
      }
    }
  }, [open, tenant]);

  if (!open || !tenant) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Tenant Info"
      maxWidth="md"
      footer={
        <div className="flex w-full items-center justify-end gap-2.5">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" form="edit-tenant-form" loading={loading} className="px-5">
            Save Tenant
          </Button>
        </div>
      }
    >
      <form id="edit-tenant-form" onSubmit={handleSubmit} className="space-y-4 text-sm">
        {error && <AlertBanner variant="danger" message={error} />}

        {/* Full Name */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-fg flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-accent" /> Full Name
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Resident full name"
            required
          />
        </div>

        {/* Property & Room Select */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-fg flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-accent" /> Property
            </label>
            <div className="relative">
              <Select
                value={tenant.property_id || ""}
                disabled
                className="bg-card/40 cursor-not-allowed opacity-90"
              >
                <option value={tenant.property_id}>
                  {tenant.property_name || "Assigned Property"}
                </option>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-fg flex items-center gap-1.5">
              <Home className="h-3.5 w-3.5 text-accent" /> Room / Unit
            </label>
            {rooms.length > 0 ? (
              <Select
                value={room}
                onChange={(e) => setRoom(e.target.value)}
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.room_number}>
                    Room {r.room_number} (₱{r.rent.toLocaleString()})
                  </option>
                ))}
              </Select>
            ) : (
              <Input
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="e.g. Unit 1 or 102"
                required
              />
            )}
          </div>
        </div>

        {/* Email & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-fg flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-accent" /> Email Address
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tenant@example.com"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-fg flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-accent" /> Contact Phone
            </label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09171234567"
              required
            />
          </div>
        </div>

        {/* Water Rate & Advance Deposit */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-fg flex items-center gap-1.5">
              <Droplets className="h-3.5 w-3.5 text-sky-500" /> Monthly Water Rate (₱)
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={waterRate}
              onChange={(e) => setWaterRate(parseFloat(e.target.value) || 0)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-fg flex items-center gap-1.5">
              <Banknote className="h-3.5 w-3.5 text-emerald-500" /> Advance Deposit (₱)
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={advancePaid}
              onChange={(e) => setAdvancePaid(parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        {/* Move-in Date & Lease End Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-fg flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-accent" /> Move-In Date
            </label>
            <Input
              type="date"
              value={moveInDate}
              onChange={(e) => setMoveInDate(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-fg flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-accent" /> Lease Expiration
            </label>
            <Input
              type="date"
              value={leaseEnd}
              onChange={(e) => setLeaseEnd(e.target.value)}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
