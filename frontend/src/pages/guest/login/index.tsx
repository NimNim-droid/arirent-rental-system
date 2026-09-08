import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Building2, ArrowRight, ShieldCheck, UserCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Temporary mock authentication until backend is running
    setTimeout(() => {
      if (email.includes("admin") || email === "admin@arirent.com") {
        const adminUser = {
          id: "1",
          name: "Property Manager",
          email: email || "admin@arirent.com",
          role: "admin",
        };
        localStorage.setItem("arirent_token", "demo-admin-token");
        localStorage.setItem("arirent_current_user", JSON.stringify(adminUser));
        navigate("/admin/dashboard");
      } else {
        const tenantUser = {
          id: "2",
          name: "Maria Santos",
          email: email || "tenant@arirent.com",
          role: "tenant",
        };
        localStorage.setItem("arirent_token", "demo-tenant-token");
        localStorage.setItem("arirent_current_user", JSON.stringify(tenantUser));
        navigate("/tenant/dashboard");
      }
      setLoading(false);
    }, 600);
  };

  const fillDemoAdmin = () => {
    setEmail("admin@arirent.com");
    setPassword("admin123");
  };

  const fillDemoTenant = () => {
    setEmail("tenant@arirent.com");
    setPassword("tenant123");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-600 to-sky-400 text-white shadow-lg shadow-sky-500/25 mb-2">
            <Building2 className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Welcome to AriRent</h1>
          <p className="text-sm font-medium text-slate-500">
            Sign in to access your rental management portal
          </p>
        </div>

        {/* Login Card */}
        <Card className="p-7 shadow-lg border-slate-100">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl">
                {error}
              </div>
            )}

            <Input
              id="email"
              label="Email Address or Username"
              type="text"
              placeholder="e.g. admin@arirent.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button type="submit" disabled={loading} className="w-full mt-2">
              {loading ? "Signing in..." : "Sign In"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          {/* Quick Demo Access Buttons */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-3">
              Quick Test Access (Dev Mode)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={fillDemoAdmin}
                className="text-xs"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-sky-600" />
                Fill Admin
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={fillDemoTenant}
                className="text-xs"
              >
                <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                Fill Tenant
              </Button>
            </div>
          </div>
        </Card>

        {/* Footer Link */}
        <p className="text-center text-xs font-medium text-slate-500">
          New tenant?{" "}
          <Link to="/register" className="font-bold text-sky-600 hover:text-sky-700 underline">
            Submit an application
          </Link>
        </p>
      </div>
    </div>
  );
}
