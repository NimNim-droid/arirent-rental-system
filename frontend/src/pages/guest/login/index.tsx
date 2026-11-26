import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowRight, Building2 } from "lucide-react";
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
              Available Units
            </Button>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6 animate-fade-in">
          {/* Header */}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-fg">Sign in</h1>
            <p className="text-sm text-muted">
              Access your resident or property manager portal
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
                label="Email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                id="password"
                label="Password"
                type="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <Button type="submit" size="lg" className="w-full mt-1" loading={loading}>
                {!loading && (
                  <>
                    Sign In <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </Card>

          {/* Footer Links */}
          <div className="space-y-2 text-center text-xs text-muted">
            <p>
              Looking for a unit to rent?{" "}
              <Link
                to="/"
                className="font-semibold text-accent hover:text-accent-strong underline-offset-2 hover:underline"
              >
                Browse available properties
              </Link>
            </p>
            <p>
              Already visited a room in person?{" "}
              <Link
                to="/register"
                className="font-medium text-fg-soft hover:text-fg underline-offset-2 hover:underline"
              >
                Submit an application
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
