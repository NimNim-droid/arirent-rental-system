import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowRight } from "lucide-react";
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
      <div className="flex items-center justify-between px-6 py-4 border-b border-edge">
        <Logo variant="full" size="md" />
        <ThemeToggle />
      </div>

      {/* Main content */}
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6 animate-fade-in">
          {/* Header */}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-fg">Sign in</h1>
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
                {!loading && <>Sign In <ArrowRight className="h-4 w-4" /></>}
              </Button>
            </form>

          </Card>

          {/* Footer Link */}
          <p className="text-center text-xs text-muted">
            New tenant?{" "}
            <Link to="/register" className="font-semibold text-accent hover:text-accent-strong underline-offset-2 hover:underline">
              Submit an application
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}