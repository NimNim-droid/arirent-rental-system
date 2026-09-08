import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Building2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center space-y-4 shadow-lg border-slate-100">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-2">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Application Submitted!</h2>
          <p className="text-sm text-slate-600">
            Thank you, <strong className="text-slate-800">{formData.name}</strong>. Your rental
            application for Room <strong className="text-slate-800">{formData.room}</strong> has been
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-600 to-sky-400 text-white shadow-md shadow-sky-500/20 mb-1">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Tenant Registration</h1>
          <p className="text-sm font-medium text-slate-500">
            Apply to reserve a room at an AriRent property
          </p>
        </div>

        <Card className="p-7 shadow-lg border-slate-100">
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

        <p className="text-center text-xs font-medium text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="inline-flex items-center gap-1 font-bold text-sky-600 hover:text-sky-700">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
