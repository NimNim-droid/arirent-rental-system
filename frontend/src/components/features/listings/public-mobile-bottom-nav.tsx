import { Link, useLocation, useNavigate } from "react-router";
import { Building2, Home, LayoutGrid, LogIn, Phone } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/cn";

/**
 * Native-feeling fixed mobile bottom navigation bar for public routes (/ and /properties).
 * Mirrors TenantBottomNav ergonomics and safe-area spacing.
 */
export function PublicMobileBottomNav() {
  const { user } = useAuth();
  const { pathname, hash } = useLocation();
  const navigate = useNavigate();

  const portalPath = user?.role === "admin" ? "/admin/dashboard" : "/tenant/dashboard";

  const handleContactClick = () => {
    if (pathname === "/") {
      const target = document.getElementById("contact");
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    navigate("/#contact");
  };

  const isHomeActive = pathname === "/" && hash !== "#contact";
  const isPropertiesActive = pathname === "/properties";
  const isContactActive = pathname === "/" && hash === "#contact";

  const tabClass = (active: boolean) =>
    cn(
      "group relative flex flex-col items-center justify-center h-full w-full py-1 text-center transition-all duration-200 select-none cursor-pointer active:scale-90 focus-visible:outline-none",
      active ? "text-accent" : "text-muted hover:text-fg-soft"
    );

  const pillClass = (active: boolean) =>
    cn(
      "relative flex items-center justify-center w-12 h-7 rounded-full transition-all duration-200",
      active
        ? "bg-accent-soft text-accent"
        : "text-muted group-hover:text-fg-soft group-hover:bg-hover"
    );

  return (
    <nav
      aria-label="Public Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-edge bg-card/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(15,23,42,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.35)]"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 6px)" }}
    >
      <div className="grid grid-cols-4 h-14 max-w-md mx-auto items-center px-1">
        <Link to="/" className={tabClass(isHomeActive)}>
          <div className={pillClass(isHomeActive)}>
            <Home
              className={cn(
                "h-[19px] w-[19px]",
                isHomeActive ? "stroke-[2.25]" : "stroke-[1.75]"
              )}
            />
          </div>
          <span
            className={cn(
              "text-[11px] tracking-tight leading-tight mt-0.5 truncate",
              isHomeActive ? "font-bold text-accent" : "font-medium text-muted"
            )}
          >
            Home
          </span>
        </Link>

        <Link to="/properties" className={tabClass(isPropertiesActive)}>
          <div className={pillClass(isPropertiesActive)}>
            <Building2
              className={cn(
                "h-[19px] w-[19px]",
                isPropertiesActive ? "stroke-[2.25]" : "stroke-[1.75]"
              )}
            />
          </div>
          <span
            className={cn(
              "text-[11px] tracking-tight leading-tight mt-0.5 truncate",
              isPropertiesActive ? "font-bold text-accent" : "font-medium text-muted"
            )}
          >
            Properties
          </span>
        </Link>

        <button type="button" onClick={handleContactClick} className={tabClass(isContactActive)}>
          <div className={pillClass(isContactActive)}>
            <Phone
              className={cn(
                "h-[19px] w-[19px]",
                isContactActive ? "stroke-[2.25]" : "stroke-[1.75]"
              )}
            />
          </div>
          <span
            className={cn(
              "text-[11px] tracking-tight leading-tight mt-0.5 truncate",
              isContactActive ? "font-bold text-accent" : "font-medium text-muted"
            )}
          >
            Contact
          </span>
        </button>

        <Link to={user ? portalPath : "/login"} className={tabClass(false)}>
          <div className={pillClass(false)}>
            {user ? (
              <LayoutGrid className="h-[19px] w-[19px] stroke-[1.75]" />
            ) : (
              <LogIn className="h-[19px] w-[19px] stroke-[1.75]" />
            )}
          </div>
          <span className="text-[11px] font-medium tracking-tight leading-tight mt-0.5 truncate text-muted">
            {user ? "Portal" : "Sign In"}
          </span>
        </Link>
      </div>
    </nav>
  );
}
