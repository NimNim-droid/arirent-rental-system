import { Outlet, Navigate } from "react-router";
import { Sidebar } from "@/components/common/sidebar";

export default function AdminLayout() {
  const token = localStorage.getItem("arirent_token");
  const rawUser = localStorage.getItem("arirent_current_user");
  const user = rawUser ? JSON.parse(rawUser) : null;

  // In demo mode, fallback if token is missing
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="admin" />
      <main className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
}
