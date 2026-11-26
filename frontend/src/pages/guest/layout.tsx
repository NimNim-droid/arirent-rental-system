import { Link, Outlet, useLocation } from "react-router";
import { ArrowRight, Building2, LogIn } from "lucide-react";
import { Logo } from "@/components/common/logo";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/cn";

export default function PublicLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();

  const portalPath = user?.role === "admin" ? "/admin/dashboard" : "/tenant/dashboard";
  const isCatalogActive =
    pathname === "/" || pathname.startsWith("/properties") || pathname.startsWith("/rooms");

  return (
    <div className="min-h-screen bg-app text-fg flex flex-col">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-30 border-b border-edge bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link to="/" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md">
              <Logo variant="full" size="sm" subtitle="Residential Leasing" />
            </Link>

            <nav aria-label="Public navigation" className="hidden md:flex items-center gap-1">
              <Link
                to="/"
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                  isCatalogActive
                    ? "bg-hover text-fg"
                    : "text-muted hover:bg-hover hover:text-fg"
                )}
              >
                Available Properties
              </Link>
              <a
                href="/#how-leasing-works"
                className="rounded-md px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-hover hover:text-fg"
              >
                Leasing Process
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <Link to={portalPath}>
                <Button size="sm" variant="primary">
                  {user.role === "admin" ? "Manager Portal" : "Tenant Portal"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button size="sm" variant="secondary">
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Portal Sign In</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Editorial Footer */}
      <footer className="border-t border-edge bg-card mt-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Logo variant="full" size="sm" />
              <span className="text-edge-strong">|</span>
              <span className="text-xs text-muted">
                Direct Landlord-Managed Residential Units
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
              <Link to="/" className="hover:text-fg transition-colors inline-flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                Browse Units
              </Link>
              <Link to="/login" className="hover:text-fg transition-colors">
                Resident &amp; Manager Sign In
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
