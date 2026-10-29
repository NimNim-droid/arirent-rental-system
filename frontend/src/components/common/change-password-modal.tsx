import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, KeyRound } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/errors";
import { useAuth } from "@/lib/auth-context";

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!open) return;
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setSaving(false);
    setError("");
    setSuccess("");
  }, [open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (newPassword.length < 12) {
      setError("The new password must be at least 12 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("The new password confirmation does not match.");
      return;
    }

    setSaving(true);

    try {
      const message = await changePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess(message);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to change your password."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Change password"
      footer={
        success ? (
          <Button type="button" onClick={onClose}>
            Done
          </Button>
        ) : (
          <>
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" form="change-password-form" loading={saving}>
              {!saving && "Update password"}
            </Button>
          </>
        )
      }
    >
      {success ? (
        <div className="space-y-3 py-6 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-success-fg" />
          <h3 className="text-[13px] font-medium text-fg">Password updated</h3>
          <p className="text-xs text-muted">{success}</p>
        </div>
      ) : (
        <form id="change-password-form" onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-md border border-danger-border bg-danger-bg p-3 text-xs text-danger-fg">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Input
            id="current-password"
            label="Current password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
          />

          <Input
            id="new-password"
            label="New password"
            type="password"
            autoComplete="new-password"
            helperText="At least 12 characters, with letters and numbers."
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
          />

          <Input
            id="confirm-password"
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />

          <p className="flex items-start gap-2 text-[11px] text-muted">
            <KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Changing your password signs out every other active session.
          </p>
        </form>
      )}
    </Modal>
  );
}
