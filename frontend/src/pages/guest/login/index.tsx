import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowRight, ShieldCheck, UserCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/common/logo";
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
      const loggedUser = await login({ email, password });
      if (loggedUser.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/tenant/dashboard");
      }
    } catch (err) {
      setError(getErrorMessage(err, "Unable to log in. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAdmin = () => {
    setEmail("admin@arirent.com");
    setPassword("admin");
  };

  const fillDemoTenant = () => {
    setEmail("tenant@arirent.com");
    setPassword("tenant123");
  };

  return (
    <div className="min-h-screen bg-app flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-edge">
        <Link to="/home">
          <Logo variant="full" size="md" />
        </Link>
        <ThemeToggle />
      </div>

      {/* Main content */}
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6 animate-fade-in-up">
          {/* Header */}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-fg">
              Sign in
            </h1>
            <p className="text-sm text-muted">
              Access your rental management portal
            </p>
          </div>

          {/* Login Card */}
          <Card className="p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 text-xs font-semibold text-danger-fg bg-danger-bg border border-danger-border rounded-lg">
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

              <Button type="submit" className="w-full mt-1" loading={loading}>
                {!loading && (
                  <>
                    Sign In <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Quick Test Credential Prefill */}
            <div className="mt-5 pt-5 border-t border-edge">
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
            <Link
              to="/register"
              className="font-semibold text-accent hover:text-accent-strong underline-offset-2 hover:underline"
            >
              Submit an application
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
