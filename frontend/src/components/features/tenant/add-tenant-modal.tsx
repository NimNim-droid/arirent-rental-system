import { useState, useEffect } from "react";
import { User, Building, Home, Mail, Phone, Lock, Calendar, PlusCircle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { AlertBanner } from "@/components/ui/alert-banner";
import { propertiesService } from "@/lib/services/properties";
import { authService } from "@/lib/services/auth";
import { getErrorMessage } from "@/lib/errors";
import type { Property, Room } from "@/lib/types";

interface AddTenantModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddTenantModal({ open, onClose, onSuccess }: AddTenantModalProps) {
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
      void propertiesService.getRooms({ property_id: selectedPropertyId, status: "vacant" }).then((r) => {
        setRooms(r);
        if (r.length > 0) {
          setSelectedRoomNumber(r[0].room_number);
        } else {
          setSelectedRoomNumber("");
        }
      });
    }
  }, [selectedPropertyId]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add New Tenant"
      maxWidth="md"
      footer={
        <div className="flex w-full items-center justify-end gap-2.5">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" form="add-tenant-form" loading={loading} className="px-5">
            <PlusCircle className="h-4 w-4" /> Add Tenant
          </Button>
        </div>
      }
    >
      <form id="add-tenant-form" onSubmit={handleSubmit} className="space-y-4 text-sm">
        {error && <AlertBanner variant="danger" message={error} />}

        {/* Full Name & Username */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-fg flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-accent" /> Full Name
            </label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!username) {
                  setUsername(e.target.value.toLowerCase().replace(/\s+/g, ""));
                }
              }}
              placeholder="e.g. Daniel Joseph Ramos"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-fg flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-accent" /> Username
            </label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. danielramos"
              required
            />
          </div>
        </div>

        {/* Property & Room Select */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-fg flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-accent" /> Property
            </label>
            <Select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              required
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.city})
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-fg flex items-center gap-1.5">
              <Home className="h-3.5 w-3.5 text-accent" /> Available Vacant Room
            </label>
            {rooms.length > 0 ? (
              <Select
                value={selectedRoomNumber}
                onChange={(e) => setSelectedRoomNumber(e.target.value)}
                required
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.room_number}>
                    Room {r.room_number} — ₱{r.rent.toLocaleString()}/mo
                  </option>
                ))}
              </Select>
            ) : (
              <div className="rounded-xl border border-warning/30 bg-warning/10 p-2 text-xs text-warning-fg">
                No vacant rooms available in this property.
              </div>
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
              placeholder="daniel.ramos@gmail.com"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-fg flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-accent" /> Phone Number
            </label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09170123456"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-fg flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-accent" /> Initial Password
          </label>
          <Input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Initial login password"
            required
          />
          <p className="text-[11px] text-muted">
            The tenant will use their username/email and this password to log in.
          </p>
        </div>
      </form>
    </Modal>
  );
}
