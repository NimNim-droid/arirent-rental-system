import { NavLink } from "react-router";
import { LayoutDashboard, Banknote, Wrench, FileText } from "lucide-react";
import { cn } from "@/lib/cn";

interface NavTab {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const TENANT_TABS: NavTab[] = [
  { to: "/tenant/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/tenant/billing", label: "My Bills", icon: Banknote },
  { to: "/tenant/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/tenant/documents", label: "Documents", icon: FileText },
];

export function TenantBottomNav() {
  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-edge bg-card/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.04)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.35)] transition-colors"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 6px)" }}
    >
      <div className="grid grid-cols-4 h-15 max-w-md mx-auto items-center px-1">
        {TENANT_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                cn(
                  "group relative flex flex-col items-center justify-center h-full w-full py-1 text-center transition-all duration-200 select-none cursor-pointer active:scale-90 focus-visible:outline-none",
                  isActive ? "text-accent" : "text-muted hover:text-fg-soft"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={cn(
                      "relative flex items-center justify-center w-12 h-7 rounded-full transition-all duration-200",
                      isActive
                        ? "bg-accent-soft text-accent"
                        : "text-muted group-hover:text-fg-soft group-hover:bg-hover"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-[19px] w-[19px] transition-transform duration-200",
                        isActive ? "scale-105 stroke-[2.25]" : "stroke-[1.75]"
                      )}
                    />
                  </div>
                  <span
                    className={cn(
                      "text-[10px] tracking-tight leading-tight transition-all duration-150 mt-0.5 truncate max-w-full px-0.5",
                      isActive ? "font-bold text-accent" : "font-medium text-muted"
                    )}
                  >
                    {tab.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
