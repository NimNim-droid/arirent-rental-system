import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Building2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/common/theme-toggle";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    property: "prop-1",
    room: "101",
    password: "",
    password_confirmation: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="relative min-h-screen bg-app flex items-center justify-center p-4 overflow-hidden">
        <div className="absolute right-4 top-4 z-20">
          <ThemeToggle />
        </div>
        <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 -left-32 h-96 w-96 rounded-full bg-purple-600/15 blur-3xl" />
        <Card className="relative w-full max-w-md p-8 text-center space-y-4 border-edge animate-fade-in-up">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-success-bg text-success-fg mb-2 ring-1 ring-inset ring-success-border">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-fg">Application Submitted!</h2>
          <p className="text-sm text-muted">
            Thank you, <strong className="text-fg">{formData.name}</strong>. Your rental
            application for Room <strong className="text-fg">{formData.room}</strong> has been
            received. The property manager will review and approve your account shortly.
          </p>
          <div className="pt-4">
            <Button onClick={() => navigate("/login")} className="w-full">
              Back to Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-app flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle />
      </div>
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-purple-600/15 blur-3xl" />

      <div className="relative w-full max-w-lg space-y-6 animate-fade-in-up">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-950/50 ring-1 ring-inset ring-white/10 mb-1">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-fg">Tenant Registration</h1>
          <p className="text-sm text-muted">
            Apply to reserve a room at an AriRent property
          </p>
        </div>

        <Card className="p-7 border-edge">
          <form onSubmit={handleSubmit} className="space-y-4">
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
                value={formData.property}
                onChange={(e) => setFormData({ ...formData, property: e.target.value })}
              >
                <option value="prop-1">AriRent Residences - Makati</option>
                <option value="prop-2">AriRent Heights - Quezon City</option>
              </Select>

              <Select
                id="room"
                label="Select Room"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
              >
                <option value="101">Room 101 (₱5,000/mo)</option>
                <option value="102">Room 102 (₱5,500/mo)</option>
                <option value="203">Room 203 (₱6,000/mo)</option>
              </Select>
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

            <Button type="submit" className="w-full mt-2">
              Submit Application
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-muted">
          Already have an account?{" "}
          <Link to="/login" className="inline-flex items-center gap-1 font-bold text-accent hover:text-accent-strong">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}