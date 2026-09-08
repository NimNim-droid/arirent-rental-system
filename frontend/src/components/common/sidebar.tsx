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
} from "lucide-react";
import { cn } from "@/lib/cn";

interface SidebarProps {
  role: "admin" | "tenant";
}

export function Sidebar({ role }: SidebarProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("arirent_token");
    localStorage.removeItem("arirent_current_user");
    navigate("/login");
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

  return (
    <aside className="w-64 border-r border-slate-200 bg-white min-h-screen flex flex-col justify-between shrink-0">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-600 to-sky-400 text-white shadow-md shadow-sky-500/20">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-slate-900">AriRent</h1>
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-600">
              {role === "admin" ? "Landlord Portal" : "Tenant Portal"}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150",
                    isActive
                      ? "bg-sky-50 text-sky-700 shadow-xs border border-sky-100"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center justify-between px-2 py-2 mb-2">
          <div className="truncate">
            <p className="text-sm font-bold text-slate-800 truncate">{user?.name || "Demo User"}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email || "user@arirent.com"}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
