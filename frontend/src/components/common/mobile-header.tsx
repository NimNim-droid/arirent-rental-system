import { useState, useRef, useEffect } from "react";
import { Menu, LogOut } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { Logo } from "@/components/common/logo";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { useAuth } from "@/lib/auth-context";

interface MobileHeaderProps {
  title: string;
  role?: "admin" | "tenant";
  onMenuClick?: () => void;
}

const PAGE_TITLES: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/properties": "Properties & Units",
  "/admin/tenants": "Tenants",
  "/admin/utilities": "Utilities",
  "/admin/billing": "Billing",
  "/admin/maintenance": "Maintenance",
  "/admin/documents": "Documents",
  "/tenant/dashboard": "Home",
  "/tenant/billing": "Bills",
  "/tenant/maintenance": "Services",
  "/tenant/documents": "Documents",
};

export function MobileHeader({ title, role = "admin", onMenuClick }: MobileHeaderProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const name = user?.name || "";
  const pageTitle = PAGE_TITLES[location.pathname] ?? title;
  const isTenant = role === "tenant";
  const isTenantHome = isTenant && location.pathname === "/tenant/dashboard";
  const firstName = name.split(" ")[0] || "there";

  const initials = String(name || "D")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileOpen]);

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
    navigate("/login");
  };

  const accountMenu = (
    <div
      className={`absolute ${isTenantHome ? "left-0" : "right-0"} top-full mt-2 w-60 rounded-lg border border-edge bg-card p-3 shadow-pop animate-scale-in z-50`}
    >
      <div className="flex items-center gap-2.5 pb-3 border-b border-edge">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent text-xs font-semibold text-white">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-fg">{name || "User"}</p>
          <p className="truncate text-[11px] text-muted">{user?.email || ""}</p>
          <span className="inline-block mt-1 text-[10px] font-medium text-accent bg-accent-soft px-1.5 py-0.5 rounded">
            {user?.role || "Tenant"}
          </span>
        </div>
      </div>
      <div className="pt-2">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 px-2.5 py-2 text-xs font-medium text-danger-fg hover:bg-danger-bg rounded-md transition-colors cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );

  // Tenant home: greeting bar (avatar + name, centered brand, theme toggle)
  if (isTenantHome) {
    return (
      <header className="lg:hidden sticky top-0 z-30 grid grid-cols-[1fr_auto_1fr] items-center gap-2 bg-app/85 px-4 py-3 backdrop-blur-md">
        <div className="relative flex min-w-0 items-center gap-2.5" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((o) => !o)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white shadow-soft cursor-pointer transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            title={name}
            aria-label={`Account menu for ${name}`}
            aria-expanded={profileOpen}
          >
            {initials}
          </button>
          <div className="min-w-0 leading-tight">
            <p className="text-[11px] text-muted">Hello,</p>
            <p className="truncate text-sm font-bold text-fg">{firstName}!</p>
          </div>
          {profileOpen && accountMenu}
        </div>
        <Logo size="sm" />
        <div className="flex justify-end">
          <ThemeToggle compact />
        </div>
      </header>
    );
  }

  return (
    <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-edge bg-card px-4 py-2.5">
      <div className="flex items-center gap-3 min-w-0">
        {!isTenant && onMenuClick && (
          <button
            onClick={onMenuClick}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-edge bg-card text-fg-soft hover:bg-hover hover:text-fg transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            aria-label="Open menu"
            title="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}
        <div className="flex items-center gap-2.5 min-w-0">
          <Logo variant="mark" size="sm" />
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-[13px] text-fg truncate leading-tight">{pageTitle}</span>
            {isTenant && (
              <span className="text-[10px] text-muted font-medium">AriRent Tenant</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <ThemeToggle compact />
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((o) => !o)}
            className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-xs font-semibold text-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            title={name}
            aria-label={`Account menu for ${name}`}
            aria-expanded={profileOpen}
          >
            {initials}
          </button>

          {profileOpen && accountMenu}
        </div>
      </div>
    </header>
  );
}