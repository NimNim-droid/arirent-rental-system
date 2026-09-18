import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Property } from "@/lib/types";

interface RoomFormModalProps {
  open: boolean;
  isEdit: boolean;
  actionLoading: boolean;
  properties: Property[];
  formData: {
    property_id: string;
    room_number: string;
    rent: string;
    status: "vacant" | "reserved" | "occupied";
  };
  onChange: (formData: {
    property_id: string;
    room_number: string;
    rent: string;
    status: "vacant" | "reserved" | "occupied";
  }) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function RoomFormModal({
  open,
  isEdit,
  actionLoading,
  properties,
  formData,
  onChange,
  onSubmit,
  onClose,
}: RoomFormModalProps) {
  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit Room ${formData.room_number}` : "Add New Unit / Room"}
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="room-form"
            loading={actionLoading}
          >
            {isEdit ? "Save Changes" : "Add Unit"}
          </Button>
        </>
      }
    >
      <form id="room-form" onSubmit={onSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="roomProp"
            className="mb-1.5 block text-xs font-semibold text-fg-soft"
          >
            Assigned Building
          </label>
          <Select
            id="roomProp"
            value={formData.property_id}
            onChange={(e) => onChange({ ...formData, property_id: e.target.value })}
            required
            disabled={isEdit}
          >
            <option value="" disabled>
              Select building...
            </option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.city})
              </option>
            ))}
          </Select>
        </div>

        <Input
          id="roomNumber"
          label="Unit / Room Number"
          placeholder="e.g. 101, 204A"
          value={formData.room_number}
          onChange={(e) => onChange({ ...formData, room_number: e.target.value })}
          required
        />

        <Input
          id="roomRent"
          label="Monthly Rent (₱)"
          type="number"
          min="0"
          step="50"
          placeholder="e.g. 4500"
          value={formData.rent}
          onChange={(e) => onChange({ ...formData, rent: e.target.value })}
          required
        />

        <div>
          <label
            htmlFor="roomStatus"
            className="mb-1.5 block text-xs font-semibold text-fg-soft"
          >
            Unit Status
          </label>
          <Select
            id="roomStatus"
            value={formData.status}
            onChange={(e) =>
              onChange({
                ...formData,
                status: e.target.value as "vacant" | "reserved" | "occupied",
              })
            }
          >
            <option value="vacant">Vacant (Available for occupancy)</option>
            <option value="reserved">Reserved (Application pending)</option>
            <option value="occupied">Occupied (Currently leased)</option>
          </Select>
        </div>
      </form>
    </Modal>
  );
}
