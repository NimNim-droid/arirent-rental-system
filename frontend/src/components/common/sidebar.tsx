import { useEffect, useRef, useState, type ComponentType } from "react";
import { NavLink, useNavigate } from "react-router";
import {
  LayoutGrid,
  Users,
  Gauge,
  CreditCard,
  Wrench,
  FolderClosed,
  LogOut,
  Building2,
  PanelLeftClose,
  PanelLeftOpen,
  ReceiptText,
  BarChart3,
  KeyRound,
  Wallet,
  ChevronsUpDown,
  Moon,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/common/logo";
import { ChangePasswordModal } from "@/components/common/change-password-modal";
import { useTheme } from "@/components/ui/theme";
import { useAuth } from "@/lib/auth-context";

interface SidebarProps {
  role: "admin" | "tenant";
  open?: boolean;
  onClose?: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
}

interface NavGroup {
  section?: string;
  items: NavItem[];
}

const COLLAPSE_KEY = "arirent_sidebar_collapsed";

const ADMIN_GROUPS: NavGroup[] = [
  {
    items: [
      { to: "/admin/dashboard", label: "Dashboard", icon: LayoutGrid },
    ],
  },
  {
    section: "Portfolio",
    items: [
      { to: "/admin/properties", label: "Properties & Units", icon: Building2 },
      { to: "/admin/tenants", label: "Tenants", icon: Users },
    ],
  },
  {
    section: "Finance",
    items: [
      { to: "/admin/utilities", label: "Utilities", icon: Gauge },
      { to: "/admin/billing", label: "Billing", icon: CreditCard },
      { to: "/admin/invoices", label: "Invoices", icon: ReceiptText },
      { to: "/admin/reports", label: "Financial Reports", icon: BarChart3 },
    ],
  },
  {
    section: "Operations",
    items: [
      { to: "/admin/maintenance", label: "Maintenance", icon: Wrench },
      { to: "/admin/documents", label: "Documents", icon: FolderClosed },
    ],
  },
];

const TENANT_GROUPS: NavGroup[] = [
  {
    items: [
      { to: "/tenant/dashboard", label: "Overview", icon: LayoutGrid },
    ],
  },
  {
    section: "Billing & Payments",
    items: [
      { to: "/tenant/billing", label: "My Invoices", icon: ReceiptText },
      { to: "/tenant/excess-charges", label: "Excess Charges", icon: Wallet },
    ],
  },
  {
    section: "Requests & Files",
    items: [
      { to: "/tenant/maintenance", label: "Maintenance", icon: Wrench },
      { to: "/tenant/documents", label: "Documents", icon: FolderClosed },
    ],
  },
];

export function Sidebar({ role, open = false, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSE_KEY) === "true"
  );
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profileMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(e.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setProfileMenuOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [profileMenuOpen]);

  const handleLogout = async () => {
    setProfileMenuOpen(false);
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

  const groups = role === "admin" ? ADMIN_GROUPS : TENANT_GROUPS;

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

          {/* Navigation Groups */}
          <nav className="space-y-4 px-2.5 py-3">
            {groups.map((group, groupIdx) => (
              <div key={group.section ?? groupIdx} className="space-y-0.5">
                {group.section && (
                  <p
                    className={cn(
                      "px-2.5 pb-1 text-[11px] font-medium tracking-wider text-faint uppercase select-none",
                      collapsed && "lg:hidden"
                    )}
                  >
                    {group.section}
                  </p>
                )}

                {group.items.map((link) => {
                  const Icon = link.icon;
                  const isCollapsedDesktop = collapsed;
                  return (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      onClick={handleNav}
                      title={isCollapsedDesktop ? link.label : undefined}
                      className={({ isActive }) =>
                        cn(
                          "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors duration-150 ease-out",
                          isCollapsedDesktop && "lg:justify-center lg:px-0",
                          isActive
                            ? "bg-accent-soft font-semibold text-accent"
                            : "font-medium text-fg-soft hover:bg-hover hover:text-fg"
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            strokeWidth={isActive ? 2 : 1.75}
                            className={cn(
                              "h-[17px] w-[17px] shrink-0 transition-colors",
                              isCollapsedDesktop && "lg:mx-auto",
                              isActive
                                ? "text-accent"
                                : "text-muted group-hover:text-fg-soft"
                            )}
                          />
                          <span className={cn("truncate", isCollapsedDesktop && "lg:hidden")}>
                            {link.label}
                          </span>
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Profile Menu & Collapse Toggle */}
        <div className="border-t border-edge p-3 space-y-1.5" ref={profileMenuRef}>
          <div className="relative">
            {profileMenuOpen && (
              <div
                role="menu"
                aria-label="Account menu"
                className={cn(
                  "absolute bottom-full mb-2 z-50 w-56 rounded-xl border border-edge bg-elevated p-1.5 shadow-lg shadow-black/15 animate-fade-in",
                  collapsed ? "left-0" : "inset-x-0 w-full"
                )}
              >
                <div className="border-b border-edge px-2.5 py-2 mb-1">
                  <p className="truncate text-xs font-semibold text-fg">
                    {user?.name || "Account"}
                  </p>
                  <p className="truncate text-[11px] text-muted">
                    {user?.email || ""}
                  </p>
                </div>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    toggleTheme();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-fg-soft transition-colors hover:bg-hover hover:text-fg cursor-pointer"
                >
                  {isDark ? (
                    <Sun className="h-4 w-4 shrink-0 text-amber-400" />
                  ) : (
                    <Moon className="h-4 w-4 shrink-0 text-muted" />
                  )}
                  <span>{isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    setPasswordOpen(true);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-fg-soft transition-colors hover:bg-hover hover:text-fg cursor-pointer"
                >
                  <KeyRound className="h-4 w-4 shrink-0 text-muted" />
                  <span>Change password</span>
                </button>

                <div className="my-1 border-t border-edge" />

                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-danger-fg transition-colors hover:bg-danger-bg cursor-pointer"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span>Sign out</span>
                </button>
              </div>
            )}

            {/* Clickable Profile Trigger */}
            <button
              type="button"
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              aria-expanded={profileMenuOpen}
              aria-haspopup="menu"
              title={collapsed ? `${user?.name || "Account"} — Account settings` : undefined}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg border border-edge bg-inset px-2.5 py-2 text-left transition-colors duration-150 hover:border-edge-strong hover:bg-hover cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
                collapsed && "lg:justify-center lg:border-transparent lg:bg-transparent lg:px-0"
              )}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent text-xs font-semibold text-white">
                {initials}
              </div>
              <div className={cn("min-w-0 flex-1 truncate", collapsed && "lg:hidden")}>
                <p className="truncate text-[13px] font-medium text-fg leading-tight">
                  {user?.name || ""}
                </p>
                <p className="truncate text-[11px] text-muted">
                  {user?.email || ""}
                </p>
              </div>
              <ChevronsUpDown
                className={cn(
                  "h-4 w-4 shrink-0 text-muted",
                  collapsed && "lg:hidden"
                )}
              />
            </button>
          </div>

          {/* Collapse toggle (desktop only) */}
          <button
            onClick={toggleCollapse}
            className={cn(
              "hidden h-8 items-center gap-2 rounded-md px-2.5 text-xs font-medium text-muted transition-colors duration-150 hover:bg-hover hover:text-fg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 lg:flex",
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

      <ChangePasswordModal
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
      />
    </>
  );
}