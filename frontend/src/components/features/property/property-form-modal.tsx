import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PropertyFormModalProps {
  open: boolean;
  isEdit: boolean;
  actionLoading: boolean;
  formData: {
    name: string;
    city: string;
    address: string;
  };
  onChange: (formData: { name: string; city: string; address: string }) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function PropertyFormModal({
  open,
  isEdit,
  actionLoading,
  formData,
  onChange,
  onSubmit,
  onClose,
}: PropertyFormModalProps) {
  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Building Details" : "Register New Building"}
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
            form="property-form"
            loading={actionLoading}
          >
            {isEdit ? "Save Changes" : "Register Building"}
          </Button>
        </>
      }
    >
      <form id="property-form" onSubmit={onSubmit} className="space-y-4">
        <Input
          id="propName"
          label="Building / Property Name"
          placeholder="e.g. Diamond Residences Main"
          value={formData.name}
          onChange={(e) => onChange({ ...formData, name: e.target.value })}
          required
        />

        <Input
          id="propCity"
          label="City / Municipality"
          placeholder="e.g. Quezon City"
          value={formData.city}
          onChange={(e) => onChange({ ...formData, city: e.target.value })}
          required
        />

        <Input
          id="propAddress"
          label="Complete Street Address"
          placeholder="e.g. 123 Katipunan Ave., Brgy. Loyola Heights"
          value={formData.address}
          onChange={(e) => onChange({ ...formData, address: e.target.value })}
          required
        />
      </form>
    </Modal>
  );
}
