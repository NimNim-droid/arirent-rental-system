import { Link, useNavigate } from "react-router";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  DoorOpen,
  MapPin,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Logo } from "@/components/common/logo";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { ListingMediaPlaceholder } from "@/components/features/listings";
import { useRegister } from "@/components/features/auth";
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
      {/* Top bar */}
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

      {/* Main content */}
      <div className="flex flex-1 items-start justify-center p-4 py-8 overflow-y-auto">
        <div className="w-full max-w-lg space-y-5 animate-fade-in">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-fg">Tenant Application</h1>
            <p className="text-xs sm:text-sm text-muted">
              Create your resident account and reserve your chosen unit pending landlord approval
            </p>
          </div>

          {/* Selected Unit Summary Banner (when arriving from /rooms/:id) */}
          {loadingSelectedRoom ? (
            <Card className="p-4 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-12 w-full" />
            </Card>
          ) : selectedPublicRoom ? (
            <Card className="overflow-hidden">
              <div className="flex items-center gap-3.5 p-3.5">
                <div className="h-16 w-20 shrink-0 overflow-hidden rounded-md border border-edge bg-inset">
                  {selectedPublicRoom.cover_photo_url ? (
                    <img
                      src={selectedPublicRoom.cover_photo_url}
                      alt={`Room ${selectedPublicRoom.room_number}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ListingMediaPlaceholder kind="room" label="Unit" className="h-full w-full" />
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-fg truncate">
                      Room {selectedPublicRoom.room_number} &mdash;{" "}
                      {selectedPublicRoom.property?.name}
                    </span>
                    <Badge variant={selectedPublicRoom.is_available ? "success" : "warning"}>
                      {selectedPublicRoom.is_available ? "Vacant" : selectedPublicRoom.status}
                    </Badge>
                  </div>
                  {selectedPublicRoom.property && (
                    <p className="flex items-center gap-1 text-xs text-muted truncate">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {selectedPublicRoom.property.address}, {selectedPublicRoom.property.city}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-xs">
                    <span className="font-semibold text-fg tabular-nums">
                      {formatCurrency(selectedPublicRoom.rent)}/mo &middot;{" "}
                      <span className="font-normal text-muted">
                        <Users className="inline h-3 w-3 mr-0.5" />
                        Up to {selectedPublicRoom.capacity}
                      </span>
                    </span>
                    <Link
                      to={`/rooms/${selectedPublicRoom.id}`}
                      className="font-medium text-accent hover:underline"
                    >
                      View unit details
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            /* Helpful prompt when user opened /register without viewing listings first */
            <div className="flex items-center justify-between gap-3 rounded-xl border border-edge bg-card p-3.5 text-xs">
              <div className="min-w-0">
                <p className="font-semibold text-fg">Haven&apos;t inspected a unit yet?</p>
                <p className="text-muted mt-0.5">
                  View room photos, rates, and book a visit with the landlord first.
                </p>
              </div>
              <Link to="/" className="shrink-0">
                <Button variant="secondary" size="sm">
                  Browse Units
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          )}

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

              {/* Show building/room dropdowns only when not pre-locked to a specific listing room */}
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
