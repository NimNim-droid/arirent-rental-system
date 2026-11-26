import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { ArrowRight, Building2, LogIn, Menu, Phone, X } from "lucide-react";
import { Logo } from "@/components/common/logo";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { Button } from "@/components/ui/button";
import { PublicMobileBottomNav } from "@/components/features/listings";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/cn";

interface PublicNavLink {
  label: string;
  to: string;
  isHashLink?: boolean;
  matchPath?: string;
  matchHash?: string;
}

const NAV_LINKS: PublicNavLink[] = [
  { label: "Home", to: "/", matchPath: "/", matchHash: "" },
  { label: "Properties", to: "/properties", matchPath: "/properties" },
  { label: "Rooms", to: "/properties?mode=vacant&tab=rooms" },
  { label: "How It Works", to: "/#how-leasing-works", isHashLink: true, matchHash: "#how-leasing-works" },
  { label: "About Us", to: "/#about-us", isHashLink: true, matchHash: "#about-us" },
  { label: "Contact", to: "/#contact", isHashLink: true, matchHash: "#contact" },
];

export default function PublicLayout() {
  const { user } = useAuth();
  const { pathname, hash, search } = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const portalPath = user?.role === "admin" ? "/admin/dashboard" : "/tenant/dashboard";
  const portalLabel = user?.role === "admin" ? "Manager Portal" : "Tenant Portal";

  // Show the public bottom nav on Home and Properties catalog (detail pages show MobileListingActionBar instead)
  const showMobileBottomNav = pathname === "/" || pathname === "/properties";

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname, hash, search]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  const isNavItemActive = (item: PublicNavLink) => {
    if (item.label === "Rooms") {
      return pathname === "/properties" && search.includes("tab=rooms");
    }
    if (item.label === "Properties") {
      return (
        (pathname === "/properties" && !search.includes("tab=rooms")) ||
        pathname.startsWith("/properties/") ||
        pathname.startsWith("/rooms/")
      );
    }
    if (item.isHashLink) {
      return pathname === "/" && hash === item.matchHash;
    }
    return pathname === "/" && hash === "";
  };

  return (
    <div
      className={cn(
        "min-h-screen min-h-dvh bg-app text-fg flex flex-col",
        showMobileBottomNav && "pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] lg:pb-0"
      )}
    >
      {/* Sticky Website Navigation Bar */}
      <header
        className="sticky top-0 z-30 border-b border-edge bg-card/95 backdrop-blur-md supports-[backdrop-filter]:bg-card/88"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="mx-auto flex h-14 sm:h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          {/* Brand */}
          <Link
            to="/"
            className="shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Logo variant="full" size="sm" subtitle="Residential Leasing" />
          </Link>

          {/* Desktop Centered Navigation */}
          <nav aria-label="Public navigation" className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((item) => {
              const active = isNavItemActive(item);
              const classes = cn(
                "relative px-3 py-2 text-[13px] font-medium transition-colors rounded-lg",
                active
                  ? "text-accent font-semibold"
                  : "text-fg-soft hover:text-fg hover:bg-hover/60"
              );

              if (item.isHashLink) {
                return (
                  <a key={item.label} href={item.to} className={classes}>
                    {item.label}
                    {active && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-3 -bottom-[17px] h-0.5 rounded-full bg-accent"
                      />
                    )}
                  </a>
                );
              }

              return (
                <Link key={item.label} to={item.to} className={classes}>
                  {item.label}
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-3 -bottom-[17px] h-0.5 rounded-full bg-accent"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions + Mobile Trigger */}
          <div className="flex items-center gap-2">
            <ThemeToggle compact />

            {user ? (
              <Link to={portalPath} className="hidden sm:inline-flex">
                <Button size="md" variant="primary" className="h-9 rounded-xl font-semibold">
                  <span>{portalLabel}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden sm:inline-flex">
                  <Button size="md" variant="ghost" className="h-9 rounded-xl font-semibold text-fg-soft">
                    <LogIn className="h-3.5 w-3.5" />
                    <span>Sign In</span>
                  </Button>
                </Link>
                <a href="/#contact" className="hidden md:inline-flex">
                  <Button size="md" variant="primary" className="h-9 rounded-xl font-semibold">
                    <Phone className="h-3.5 w-3.5" />
                    <span>Get in Touch</span>
                  </Button>
                </a>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              className="inline-flex lg:hidden h-9 w-9 items-center justify-center rounded-xl border border-edge bg-card text-fg-soft hover:bg-hover hover:text-fg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Phone Slide-Down Menu — shows only secondary links when bottom nav owns primary tabs */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-edge bg-card px-4 py-4 shadow-pop animate-fade-in">
            <nav aria-label="Mobile navigation" className="flex flex-col space-y-1">
              {(showMobileBottomNav
                ? NAV_LINKS.filter(
                    (item) =>
                      item.label === "Rooms" ||
                      item.label === "How It Works" ||
                      item.label === "About Us"
                  )
                : NAV_LINKS
              ).map((item) => {
                const active = isNavItemActive(item);
                const classes = cn(
                  "flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors",
                  active
                    ? "bg-accent-soft text-accent"
                    : "text-fg-soft hover:bg-hover hover:text-fg"
                );

                if (item.isHashLink) {
                  return (
                    <a
                      key={item.label}
                      href={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={classes}
                    >
                      <span>{item.label}</span>
                    </a>
                  );
                }

                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={classes}
                  >
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-edge pt-4">
              {user ? (
                <Link
                  to={portalPath}
                  onClick={() => setMobileMenuOpen(false)}
                  className="col-span-2"
                >
                  <Button size="lg" variant="primary" className="w-full h-11 rounded-xl font-semibold">
                    <span>Open {portalLabel}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button size="lg" variant="secondary" className="w-full h-11 rounded-xl font-semibold">
                      <LogIn className="h-4 w-4" />
                      <span>Sign In</span>
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button size="lg" variant="primary" className="w-full h-11 rounded-xl font-semibold">
                      <span>Apply Now</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Multi-Column Editorial Footer */}
      <footer className="border-t border-edge bg-card mt-12 lg:mt-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-7 sm:py-12">
          <div className="grid grid-cols-2 lg:grid-cols-12 gap-6 sm:gap-8">
            <div className="col-span-2 lg:col-span-5 space-y-2.5">
              <Logo variant="full" size="sm" subtitle="Residential Leasing" />
              <p className="text-xs text-muted leading-relaxed max-w-sm">
                Direct landlord-managed residential rentals with transparent monthly rates,
                in-person unit viewings, metered utility tracking, and digital resident billing.
              </p>
            </div>

            <div className="col-span-1 lg:col-span-3 space-y-2.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-fg">Explore</p>
              <ul className="space-y-2 text-xs text-muted">
                <li>
                  <Link to="/properties" className="hover:text-accent transition-colors">
                    Managed Buildings
                  </Link>
                </li>
                <li>
                  <Link
                    to="/properties?mode=vacant&tab=rooms"
                    className="hover:text-accent transition-colors"
                  >
                    Available Rooms
                  </Link>
                </li>
                <li>
                  <a href="/#how-leasing-works" className="hover:text-accent transition-colors">
                    How Leasing Works
                  </a>
                </li>
                <li>
                  <a href="/#about-us" className="hover:text-accent transition-colors">
                    About AriRent
                  </a>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-4 space-y-2.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-fg">
                Tenant &amp; Portal Access
              </p>
              <ul className="space-y-2 text-xs text-muted">
                <li>
                  <a
                    href="/#contact"
                    className="hover:text-accent transition-colors inline-flex items-center gap-1.5"
                  >
                    <Phone className="h-3.5 w-3.5 text-faint" />
                    Contact Leasing Office
                  </a>
                </li>
                <li>
                  <Link
                    to="/register"
                    className="hover:text-accent transition-colors inline-flex items-center gap-1.5"
                  >
                    <Building2 className="h-3.5 w-3.5 text-faint" />
                    Submit Rental Application
                  </Link>
                </li>
                <li>
                  <Link
                    to={user ? portalPath : "/login"}
                    className="hover:text-accent transition-colors inline-flex items-center gap-1.5"
                  >
                    <LogIn className="h-3.5 w-3.5 text-faint" />
                    {user ? `Go to ${portalLabel}` : "Resident & Manager Sign In"}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-edge pt-6 text-[11px] text-muted">
            <p>&copy; {new Date().getFullYear()} AriRent Residential Leasing. All rights reserved.</p>
            <p>Direct Landlord-Managed Properties</p>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar */}
      {showMobileBottomNav && <PublicMobileBottomNav />}
    </div>
  );
}
