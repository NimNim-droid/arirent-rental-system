import { useState } from "react";
import type { CSSProperties } from "react";
import { NavLink, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Users,
  Zap,
  Receipt,
  Wrench,
  FileText,
  LogOut,
  Building2,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { ThemeToggle } from "@/components/common/theme-toggle";

interface SidebarProps {
  role: "admin" | "tenant";
  open?: boolean;
  onClose?: () => void;
}

const COLLAPSE_KEY = "arirent_sidebar_collapsed";

export function Sidebar({ role, open = false, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSE_KEY) === "true"
  );

  const handleLogout = () => {
    localStorage.removeItem("arirent_token");
    localStorage.removeItem("arirent_current_user");
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
    { to: "/admin/tenants", label: "Tenants", icon: Users },
    { to: "/admin/utilities", label: "Utilities", icon: Zap },
    { to: "/admin/billing", label: "Billing", icon: Receipt },
    { to: "/admin/maintenance", label: "Maintenance", icon: Wrench },
  ];

  const tenantLinks = [
    { to: "/tenant/dashboard", label: "Overview", icon: LayoutDashboard },
    { to: "/tenant/billing", label: "My Bills", icon: Receipt },
    { to: "/tenant/maintenance", label: "Maintenance", icon: Wrench },
    { to: "/tenant/documents", label: "Documents", icon: FileText },
  ];

  const links = role === "admin" ? adminLinks : tenantLinks;

  const rawUser = localStorage.getItem("arirent_current_user");
  const user = rawUser ? JSON.parse(rawUser) : null;
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
          "fixed inset-y-0 left-0 z-50 flex min-h-screen shrink-0 flex-col justify-between border-r border-edge bg-card transition-all duration-300 ease-out lg:static lg:z-auto lg:bg-card",
          open ? "translate-x-0 shadow-2xl shadow-black/60" : "-translate-x-full lg:translate-x-0",
          collapsed ? "w-64 lg:w-[76px]" : "w-64 sm:w-72 lg:w-64"
        )}
      >
        <div>
          {/* Brand Header */}
          <div
            className={cn(
              "flex items-center gap-3 border-b border-edge px-5 py-5",
              collapsed && "lg:justify-center lg:px-0"
            )}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-950/60 ring-1 ring-inset ring-white/10">
              <Building2 className="h-5 w-5" />
            </div>
            <div className={cn("min-w-0", collapsed && "lg:hidden")}>
              <h1 className="truncate text-base font-extrabold tracking-tight text-fg">
                AriRent
              </h1>
              <span className="text-[11px] font-bold uppercase tracking-wider text-accent">
                {role === "admin" ? "Landlord Portal" : "Tenant Portal"}
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1 p-3">
            {links.map((link, i) => {
              const Icon = link.icon;
              const isCollapsed = collapsed;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={handleNav}
                  title={isCollapsed ? link.label : undefined}
                  style={{ animationDelay: `${i * 60}ms` } as CSSProperties}
                  className={({ isActive }) =>
                    cn(
                      "relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold animate-fade-in-up transition-all duration-200 ease-out",
                      isCollapsed && "lg:justify-center lg:px-0",
                      isActive
                        ? "bg-accent-soft text-accent border border-accent-border"
                        : "text-muted hover:bg-hover hover:text-fg border border-transparent"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-1/2 hidden h-5 w-1 -translate-y-1/2 rounded-r-full bg-accent lg:block" />
                      )}
                      <Icon className={cn("h-[18px] w-[18px] shrink-0", isCollapsed && "lg:mx-auto")} />
                      <span className={cn("truncate", isCollapsed && "lg:hidden")}>
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
        <div className="space-y-2 border-t border-edge p-4">
          {!collapsed ? (
            <div className="flex items-center gap-3 rounded-xl border border-edge bg-inset px-3 py-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white">
                {initials}
              </div>
              <div className="min-w-0 truncate">
                <p className="truncate text-sm font-bold text-fg">{user?.name || "Demo User"}</p>
                <p className="truncate text-[11px] text-muted">
                  {user?.email || "user@arirent.com"}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 rounded-xl border border-edge bg-inset px-3 py-2.5 lg:hidden">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white">
                  {initials}
                </div>
                <div className="min-w-0 truncate">
                  <p className="truncate text-sm font-bold text-fg">{user?.name || "Demo User"}</p>
                  <p className="truncate text-[11px] text-muted">
                    {user?.email || "user@arirent.com"}
                  </p>
                </div>
              </div>
              <div
                className="hidden justify-center py-1 lg:flex"
                title={user?.name || "Demo User"}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white">
                  {initials}
                </div>
              </div>
            </>
          )}

          <div className={cn("grid grid-cols-2 gap-2", collapsed && "lg:grid-cols-1")}>
            <ThemeToggle compact className="w-full" />
            <button
              onClick={handleLogout}
              title="Log out"
              aria-label="Log out"
              className="inline-flex h-9 w-full items-center justify-center rounded-xl border border-transparent px-2.5 text-xs font-semibold text-danger-fg transition-all duration-200 hover:border-danger-border hover:bg-danger-bg cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          {/* Collapse toggle (desktop only) */}
          <button
            onClick={toggleCollapse}
            className={cn(
              "hidden h-9 items-center gap-2 rounded-xl px-2.5 text-xs font-semibold text-muted transition-all duration-200 hover:bg-hover hover:text-fg cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:inline-flex",
              collapsed ? "w-full justify-center" : "w-full justify-start"
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4 shrink-0" />
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4 shrink-0" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}