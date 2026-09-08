import { Outlet, Navigate } from "react-router";
import { Sidebar } from "@/components/common/sidebar";

export default function TenantLayout() {
  const token = localStorage.getItem("arirent_token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="tenant" />
      <main className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
}
