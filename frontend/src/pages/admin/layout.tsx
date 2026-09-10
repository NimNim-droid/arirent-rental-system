import { useState } from "react";
import { Outlet, Navigate, useLocation } from "react-router";
import { Sidebar } from "@/components/common/sidebar";
import { MobileHeader } from "@/components/common/mobile-header";

export default function AdminLayout() {
  const token = localStorage.getItem("arirent_token");
  const rawUser = localStorage.getItem("arirent_current_user");
  const user = rawUser ? JSON.parse(rawUser) : null;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // In demo mode, fallback if token is missing
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === "tenant") {
    return <Navigate to="/tenant/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen bg-app">
      <Sidebar role="admin" open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <MobileHeader title="AriRent" onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          <div key={location.pathname} className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}