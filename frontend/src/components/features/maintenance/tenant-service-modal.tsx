import { useState, useEffect, useRef } from "react";
import { AlertCircle, Camera, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { maintenanceService } from "@/lib/services/maintenance";
import { getErrorMessage } from "@/lib/errors";
import type { MaintenanceTicket } from "@/lib/types";

interface TenantServiceModalProps {
  open: boolean;
  onClose: () => void;
  serviceCategory: "repairs" | "housekeeping";
  onSuccess: () => void | Promise<void>;
}

export function TenantServiceModal({
  open,
  onClose,
  serviceCategory,
  onSuccess,
}: TenantServiceModalProps) {
  const isRepairs = serviceCategory === "repairs";

  const [issueType, setIssueType] = useState<MaintenanceTicket["type"]>(
    isRepairs ? "plumbing" : "general"
  );
  const [description, setDescription] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setIssueType(isRepairs ? "plumbing" : "general");
      setDescription("");
      setPhotoFile(null);
      setPhotoPreview(null);
      setError("");
    }
  }, [open, isRepairs]);

  // Clean up object URL on unmount or photo change
  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Photo must be smaller than 5MB.");
      return;
    }

    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      setError("Please select a JPG or PNG image.");
      return;
    }

    setError("");
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleRemovePhoto = () => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("type", isRepairs ? issueType : "general");
      formData.append("priority", "normal");
      formData.append("description", description.trim());
      if (photoFile) {
        formData.append("photo", photoFile);
      }

      await maintenanceService.createTicket(formData);
      await onSuccess();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to submit service request."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      hideHeader
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1 pb-1">
        {/* Header */}
        <div className="space-y-0.5">
          <h2 className="text-lg font-bold tracking-tight text-fg">
            {isRepairs ? "Report a problem" : "Request Housekeeping"}
          </h2>
          <p className="text-xs text-muted">
            {isRepairs
              ? "Tell us what's wrong in your unit."
              : "Book a cleaning or general assistance."}
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-danger-border bg-danger-bg p-3 text-xs font-semibold text-danger-fg">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Category Chips */}
        {isRepairs && (
          <div className="flex flex-wrap gap-2 pt-1">
            {[
              { value: "plumbing", label: "Plumbing" },
              { value: "electrical", label: "Electrical" },
              { value: "appliances", label: "Aircon" },
              { value: "general", label: "Other" },
            ].map((chip) => (
              <button
                key={chip.value}
                type="button"
                onClick={() => setIssueType(chip.value as MaintenanceTicket["type"])}
                className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer active:scale-95 ${
                  issueType === chip.value
                    ? "bg-[#C8A04A] border-[#C8A04A] text-[#2A2008] shadow-soft"
                    : "bg-card border-edge text-muted hover:text-fg hover:bg-hover"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}

        {/* What's happening textarea */}
        <div>
          <Textarea
            id="modal-description"
            placeholder="What's happening?"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="rounded-2xl border-edge bg-inset text-sm p-3.5"
          />
        </div>

        {/* Picture Attachment Option */}
        <div className="space-y-2">
          {!photoPreview ? (
            <label className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border border-dashed border-edge bg-card text-muted hover:text-fg hover:border-accent/50 transition-colors cursor-pointer w-fit select-none">
              <Camera className="h-4 w-4 text-accent" />
              <span className="text-xs font-semibold">Attach photo (optional)</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                className="sr-only"
                onChange={handlePhotoSelect}
              />
            </label>
          ) : (
            <div className="relative flex items-center gap-3 p-2 rounded-2xl border border-edge bg-inset">
              <img
                src={photoPreview}
                alt="Selected issue photo"
                className="h-12 w-12 rounded-xl object-cover border border-edge shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-fg truncate">
                  {photoFile?.name}
                </p>
                <p className="text-[10px] text-muted">
                  {photoFile ? (photoFile.size / 1024).toFixed(0) : "0"} KB · Photo attached
                </p>
              </div>
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="p-1.5 rounded-lg text-muted hover:text-danger-fg transition-colors cursor-pointer"
                aria-label="Remove photo"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Send Request Button */}
        <div className="pt-1">
          <button
            type="submit"
            disabled={submitting || !description.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#14233F] dark:bg-[#1D3560] py-3.5 px-4 text-sm font-bold text-white shadow-soft transition-all hover:opacity-95 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <span>{submitting ? "Sending..." : "Send request"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
