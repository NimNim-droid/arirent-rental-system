import { useState } from "react";
import type { CSSProperties } from "react";
import { NavLink, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Users,
  Zap,
  Banknote,
  Wrench,
  FileText,
  LogOut,
  Building,
  PanelLeftClose,
  PanelLeftOpen,
  ReceiptText,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/common/logo";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { useAuth } from "@/lib/auth-context";

interface SidebarProps {
  role: "admin" | "tenant";
  open?: boolean;
  onClose?: () => void;
}

const COLLAPSE_KEY = "arirent_sidebar_collapsed";

export function Sidebar({ role, open = false, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSE_KEY) === "true"
  );

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const toggleCollapse = () => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem(COLLAPSE_KEY, String(next));
      return next;
    });
  };

  const adminLinks = [
    { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/properties", label: "Properties & Units", icon: Building },
    { to: "/admin/tenants", label: "Tenants", icon: Users },
    { to: "/admin/utilities", label: "Utilities", icon: Zap },
    { to: "/admin/billing", label: "Billing", icon: ReceiptText },
    { to: "/admin/invoices", label: "Invoice", icon: FileText },
    { to: "/admin/maintenance", label: "Maintenance", icon: Wrench },
    { to: "/admin/documents", label: "Documents", icon: FileText },
  ];

  const tenantLinks = [
    { to: "/tenant/dashboard", label: "Overview", icon: LayoutDashboard },
    { to: "/tenant/billing", label: "My Invoices", icon: Banknote },
    { to: "/tenant/excess-charges", label: "Excess Charges", icon: ReceiptText },
    { to: "/tenant/maintenance", label: "Maintenance", icon: Wrench },
    { to: "/tenant/documents", label: "Documents", icon: FileText },
  ];

  const links = role === "admin" ? adminLinks : tenantLinks;

  const initials = String(user?.name || "D")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleNav = () => onClose?.();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 animate-fade-in bg-slate-950/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex min-h-screen shrink-0 flex-col justify-between border-r border-edge bg-card transition-all duration-300 ease-out lg:static lg:z-auto",
          open ? "translate-x-0 shadow-2xl shadow-black/60" : "-translate-x-full lg:translate-x-0",
          collapsed ? "w-64 lg:w-[68px]" : "w-64 sm:w-72 lg:w-64"
        )}
      >
        <div>
          {/* Brand Header */}
          <div
            className={cn(
              "flex items-center border-b border-edge px-5 py-[18px]",
              collapsed ? "lg:justify-center lg:px-0" : "gap-3"
            )}
          >
            <div className={cn("hidden lg:block", !collapsed && "lg:hidden")}>
              <Logo variant="mark" size="md" />
            </div>
            <div className={cn(collapsed && "lg:hidden")}>
              <Logo
                variant="full"
                size="md"
                subtitle={role === "admin" ? "Landlord Portal" : "Tenant Portal"}
              />
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-0.5 p-2">
            {links.map((link, i) => {
              const Icon = link.icon;
              const isCollapsedDesktop = collapsed;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={handleNav}
                  title={isCollapsedDesktop ? link.label : undefined}
                  style={{ animationDelay: `${i * 60}ms` } as CSSProperties}
                  className={({ isActive }) =>
                    cn(
                      "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold animate-fade-in-up transition-all duration-150 ease-out",
                      isCollapsedDesktop && "lg:justify-center lg:px-0",
                      isActive
                        ? "bg-accent-soft text-accent"
                        : "text-muted hover:bg-hover hover:text-fg-soft"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-1/2 hidden h-5 w-1 -translate-y-1/2 rounded-r-full bg-accent lg:block" />
                      )}
                      <Icon className={cn("h-[18px] w-[18px] shrink-0", isCollapsedDesktop && "lg:mx-auto")} />
                      <span className={cn("truncate", isCollapsedDesktop && "lg:hidden")}>
                        {link.label}
                      </span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Info, Theme Toggle & Logout */}
        <div className="border-t border-edge p-3 space-y-2">
          {/* User info row */}
          <div className={cn(
            "flex items-center gap-2.5 rounded-lg border border-edge bg-inset px-3 py-2",
            collapsed && "lg:hidden"
          )}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-strong text-xs font-bold text-white shadow-sm">
              {initials}
            </div>
            <div className="min-w-0 flex-1 truncate">
              <p className="truncate text-sm font-semibold text-fg leading-tight">{user?.name || ""}</p>
              <p className="truncate text-[11px] text-muted">{user?.email || ""}</p>
            </div>
          </div>

          {/* Collapsed desktop: just the avatar */}
          <div
            className={cn("hidden justify-center", collapsed && "lg:flex")}
            title={user?.name || ""}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-strong text-xs font-bold text-white shadow-sm">
              {initials}
            </div>
          </div>

          {/* Action row */}
          <div className={cn("flex items-center gap-2", collapsed && "lg:flex-col lg:gap-1.5")}>
            <ThemeToggle compact className="flex-1 lg:w-full" />
            <button
              onClick={handleLogout}
              title="Log out"
              aria-label="Log out"
              className="inline-flex h-9 flex-1 items-center justify-center rounded-lg border border-transparent px-2.5 text-xs font-semibold text-muted transition-all duration-150 hover:border-danger-border hover:bg-danger-bg hover:text-danger-fg cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:w-full"
            >
              <LogOut className="h-4 w-4" />
              <span className={cn("ml-1.5", collapsed && "lg:hidden")}>Sign out</span>
            </button>
          </div>

          {/* Collapse toggle (desktop only) */}
          <button
            onClick={toggleCollapse}
            className={cn(
              "hidden h-8 items-center gap-2 rounded-lg px-2.5 text-xs font-medium text-muted transition-all duration-150 hover:bg-hover hover:text-fg cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:flex",
              collapsed ? "w-full justify-center" : "w-full justify-start"
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4 shrink-0" />
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4 shrink-0" />
                <span>Collapse sidebar</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}