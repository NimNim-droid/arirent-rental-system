import { User, Building, Home, Mail, Phone, Calendar, Droplets, Banknote } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { AlertBanner } from "@/components/ui/alert-banner";
import type { Tenant } from "@/lib/types";
import { useEditTenantForm } from "./hooks/useEditTenantForm";

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
  const {
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
  } = useEditTenantForm({ tenant, open, onClose, onSuccess });

  if (!open || !tenant) return null;

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
