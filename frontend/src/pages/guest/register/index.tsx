import { Link, useNavigate } from "react-router";
import { ArrowLeft, Building2, CheckCircle2, DoorOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/common/logo";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { SelectedRoomBanner, useRegister } from "@/components/features/auth";
import { formatCurrency } from "@/lib/formatters";

export default function RegisterPage() {
  const navigate = useNavigate();
  const {
    submitted,
    loading,
    error,
    selectedPublicRoom,
    loadingSelectedRoom,
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
        <header className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-edge bg-card">
          <Link to="/">
            <Logo variant="full" size="sm" subtitle="Residential Leasing" />
          </Link>
          <ThemeToggle />
        </header>

        <div className="flex flex-1 items-center justify-center p-4">
          <Card className="w-full max-w-md p-7 text-center space-y-4 animate-fade-in">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-success-bg text-success-fg ring-1 ring-inset ring-success-border">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold text-fg">Application Received</h2>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              Thank you, <strong className="text-fg">{submitted.name}</strong>. Room{" "}
              <strong className="text-fg">{submitted.room}</strong>
              {submitted.propertyName ? (
                <>
                  {" "}
                  at <strong className="text-fg">{submitted.propertyName}</strong>
                </>
              ) : null}{" "}
              is now <strong className="text-fg">reserved</strong> under your name while the
              property manager reviews and approves your account.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button variant="secondary" onClick={() => navigate("/")} className="flex-1">
                Back to Listings
              </Button>
              <Button onClick={() => navigate("/login")} className="flex-1">
                Go to Sign In
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const isSubmitDisabled =
    loading ||
    loadingSelectedRoom ||
    (selectedPublicRoom
      ? !selectedPublicRoom.is_available
      : loadingRooms || rooms.length === 0);

  return (
    <div className="min-h-screen bg-app flex flex-col">
      <header className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-edge bg-card">
        <Link to="/">
          <Logo variant="full" size="sm" subtitle="Residential Leasing" />
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <Building2 className="h-3.5 w-3.5" />
              Browse Units
            </Button>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-1 items-start justify-center p-4 py-8 overflow-y-auto">
        <div className="w-full max-w-lg space-y-5 animate-fade-in">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-fg">Tenant Application</h1>
            <p className="text-xs sm:text-sm text-muted">
              Create your resident account and reserve your chosen unit pending landlord approval
            </p>
          </div>

          <SelectedRoomBanner room={selectedPublicRoom} loading={loadingSelectedRoom} />

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

              {!selectedPublicRoom && !loadingSelectedRoom && (
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

                  <div className="space-y-1.5">
                    <label htmlFor="room" className="block text-sm font-semibold text-fg-soft">
                      Available Unit
                    </label>
                    {loadingRooms ? (
                      <div className="h-8 flex items-center px-3 rounded-md border border-edge bg-inset text-xs text-muted">
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
                            Room {r.room_number} ({formatCurrency(Number(r.rent))}/mo)
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <div className="rounded-md border border-danger-border bg-danger-bg p-2 text-xs font-medium text-danger-fg">
                        No vacant rooms in this building.
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  id="password"
                  label="Create Password"
                  type="password"
                  placeholder="Min. 12 characters"
                  helperText="At least 12 characters with letters and numbers"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />

                <Input
                  id="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  placeholder="Re-enter password"
                  value={formData.password_confirmation}
                  onChange={(e) =>
                    setFormData({ ...formData, password_confirmation: e.target.value })
                  }
                  required
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full mt-1 font-semibold"
                loading={loading}
                disabled={isSubmitDisabled}
              >
                <DoorOpen className="h-4 w-4" />
                {loading
                  ? "Submitting Application..."
                  : selectedPublicRoom
                  ? `Reserve & Apply for Room ${selectedPublicRoom.room_number}`
                  : rooms.length === 0
                  ? "No Rooms Available"
                  : "Submit Rental Application"}
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
