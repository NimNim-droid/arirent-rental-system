import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Building2, ArrowRight, ShieldCheck, UserCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { useAuth } from "@/lib/auth-context";
import { getErrorMessage } from "@/lib/errors";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login({ email, password });
      navigate("/admin/dashboard");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to log in. Please try again."));
    } finally {
      setLoading(false);
    }
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
    <div className="relative min-h-screen bg-app flex items-center justify-center p-4 overflow-hidden">
      {/* Theme toggle */}
      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle />
      </div>

      {/* Ambient glows */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-purple-600/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-sky-600/10 blur-3xl" />

      <div className="relative w-full max-w-md space-y-6 animate-fade-in-up">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-950/50 ring-1 ring-inset ring-white/10 mb-2">
            <Building2 className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-fg">Welcome to AriRent</h1>
          <p className="text-sm text-muted">
            Sign in to access your rental management portal
          </p>
        </div>

        {/* Login Card */}
        <Card className="p-7 border-edge">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 text-xs font-semibold text-danger-fg bg-danger-bg border border-danger-border rounded-xl">
                {error}
              </div>
            )}

            <Input
              id="email"
              label="Email Address"
              type="text"
              placeholder="e.g. admin@arirent.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button type="submit" className="w-full mt-2" loading={loading}>
              {!loading && <>Sign In <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </form>

          {/* Quick Test Credential Prefill */}
          <div className="mt-6 pt-6 border-t border-edge">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted text-center mb-3">
              Quick Test Credentials
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={fillDemoAdmin}
                className="text-xs"
                disabled={loading}
              >
                <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                Fill Admin
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={fillDemoTenant}
                className="text-xs"
                disabled={loading}
              >
                <UserCheck className="h-3.5 w-3.5 text-success-fg" />
                Fill Tenant
              </Button>
            </div>
          </div>
        </Card>

        {/* Footer Link */}
        <p className="text-center text-xs text-muted">
          New tenant?{" "}
          <Link to="/register" className="font-bold text-accent hover:text-accent-strong underline-offset-2 hover:underline">
            Submit an application
          </Link>
        </p>
      </div>
    </div>
  );
}