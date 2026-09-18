import { useState, Suspense } from "react";
import { Outlet, Navigate, useLocation } from "react-router";
import { Sidebar } from "@/components/common/sidebar";
import { MobileHeader } from "@/components/common/mobile-header";
import { TenantBottomNav } from "@/components/common/tenant-bottom-nav";
import { PageShellSkeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/auth-context";

export default function TenantLayout() {
  const { user, token, initializing } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app">
        <Spinner className="h-8 w-8 text-accent" />
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "tenant") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen bg-app">
      <Sidebar role="tenant" open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <MobileHeader title="Tenant Portal" role="tenant" onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 overflow-y-auto max-w-7xl mx-auto w-full">
          <div key={location.pathname} className="animate-fade-in">
            <Suspense fallback={<PageShellSkeleton />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
      <TenantBottomNav />
    </div>
  );
}