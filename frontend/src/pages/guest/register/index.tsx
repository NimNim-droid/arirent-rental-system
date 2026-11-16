import { Link, useNavigate } from "react-router";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/common/logo";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { useRegister } from "@/components/features/auth";

export default function RegisterPage() {
  const navigate = useNavigate();
  const {
    submitted,
    loading,
    error,
    properties,
    rooms,
    loadingRooms,
    formData,
    setFormData,
    handleSubmit,
  } = useRegister();

  if (submitted) {
    return (
      <div className="min-h-screen bg-app flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-edge">
          <Logo variant="full" size="md" />
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center p-4">
          <Card className="w-full max-w-md p-8 text-center space-y-4 animate-fade-in">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-success-bg text-success-fg mb-2 ring-1 ring-inset ring-success-border">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold text-fg">Application Submitted!</h2>
            <p className="text-sm text-muted leading-relaxed">
              Thank you, <strong className="text-fg">{submitted.name}</strong>. Your rental
              application for Room <strong className="text-fg">{submitted.room}</strong> has been
              received. The property manager will review and approve your account shortly.
            </p>
            <div className="pt-2">
              <Button onClick={() => navigate("/login")} className="w-full">
                Back to Login
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-edge">
        <Logo variant="full" size="md" />
        <ThemeToggle />
      </div>

      {/* Main content */}
      <div className="flex flex-1 items-start justify-center p-4 py-8 overflow-y-auto">
        <div className="w-full max-w-lg space-y-6 animate-fade-in">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-fg">Tenant Application</h1>
            <p className="text-sm text-muted">
              Apply to reserve a room at an AriRent property
            </p>
          </div>

          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-xs font-semibold text-danger-fg bg-danger-bg border border-danger-border rounded-lg">
                  {error}
                </div>
              )}

              <Input
                id="name"
                label="Full Name"
                placeholder="e.g. Juan Dela Cruz"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  id="email"
                  label="Email Address"
                  type="email"
                  placeholder="juan@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />

                <Input
                  id="phone"
                  label="Mobile Phone"
                  placeholder="0917-123-4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  id="property"
                  label="Property Building"
                  value={formData.property_id}
                  onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>

                <div className="space-y-1">
                  <label htmlFor="room" className="text-xs font-semibold text-fg">
                    Select Available Room
                  </label>
                  {loadingRooms ? (
                    <div className="h-10 flex items-center px-3 rounded-lg border border-edge bg-inset text-xs text-muted">
                      Checking available units...
                    </div>
                  ) : rooms.length > 0 ? (
                    <Select
                      id="room"
                      value={formData.room_number}
                      onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                      required
                    >
                      {rooms.map((r) => (
                        <option key={r.id} value={r.room_number}>
                          Room {r.room_number} (₱{Number(r.rent).toLocaleString()}/mo)
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <div className="rounded-xl border border-danger-border bg-danger-bg p-2.5 text-xs font-semibold text-danger-fg">
                      No vacant rooms available in this property.
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  id="password"
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />

                <Input
                  id="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password_confirmation}
                  onChange={(e) =>
                    setFormData({ ...formData, password_confirmation: e.target.value })
                  }
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full mt-1"
                loading={loading}
                disabled={loading || loadingRooms || rooms.length === 0}
              >
                {loading
                  ? "Submitting…"
                  : rooms.length === 0
                  ? "No Rooms Available to Apply"
                  : "Submit Application"}
              </Button>
            </form>
          </Card>

          <p className="text-center text-xs text-muted">
            Already have an account?{" "}
            <Link
              to="/login"
              className="inline-flex items-center gap-1 font-semibold text-accent hover:text-accent-strong"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
