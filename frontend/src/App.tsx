import { BrowserRouter, Routes, Route, Navigate } from "react-router";

// Guest pages
import LoginPage from "@/pages/guest/login";
import RegisterPage from "@/pages/guest/register";

// Admin pages
import AdminLayout from "@/pages/admin/layout";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminTenants from "@/pages/admin/tenants";
import AdminUtilities from "@/pages/admin/utilities";
import AdminBilling from "@/pages/admin/billing";
import AdminMaintenance from "@/pages/admin/maintenance";

// Tenant pages
import TenantLayout from "@/pages/tenant/layout";
import TenantDashboard from "@/pages/tenant/dashboard";
import TenantBilling from "@/pages/tenant/billing";
import TenantMaintenance from "@/pages/tenant/maintenance";
import TenantDocuments from "@/pages/tenant/documents";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Landlord / Admin Portal */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="tenants" element={<AdminTenants />} />
          <Route path="utilities" element={<AdminUtilities />} />
          <Route path="billing" element={<AdminBilling />} />
          <Route path="maintenance" element={<AdminMaintenance />} />
        </Route>

        {/* Tenant Portal */}
        <Route path="/tenant" element={<TenantLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<TenantDashboard />} />
          <Route path="billing" element={<TenantBilling />} />
          <Route path="maintenance" element={<TenantMaintenance />} />
          <Route path="documents" element={<TenantDocuments />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
