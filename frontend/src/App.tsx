import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { PageShellSkeleton } from "@/components/ui/skeleton";

// Layouts (loaded statically so shell renders without chunk delay)
import AdminLayout from "@/pages/admin/layout";
import TenantLayout from "@/pages/tenant/layout";

// Lazy-loaded guest pages
const LoginPage = lazy(() => import("@/pages/guest/login"));
const RegisterPage = lazy(() => import("@/pages/guest/register"));

// Lazy-loaded admin portal pages
const AdminDashboard = lazy(() => import("@/pages/admin/dashboard"));
const AdminProperties = lazy(() => import("@/pages/admin/properties"));
const AdminTenants = lazy(() => import("@/pages/admin/tenants"));
const AdminUtilities = lazy(() => import("@/pages/admin/utilities"));
const AdminBilling = lazy(() => import("@/pages/admin/billing"));
const AdminInvoices = lazy(() => import("@/pages/admin/invoices"));
const AdminReports = lazy(() => import("@/pages/admin/reports"));
const AdminMaintenance = lazy(() => import("@/pages/admin/maintenance"));
const AdminDocuments = lazy(() => import("@/pages/admin/documents"));

// Lazy-loaded tenant portal pages
const TenantDashboard = lazy(() => import("@/pages/tenant/dashboard"));
const TenantBilling = lazy(() => import("@/pages/tenant/billing"));
const TenantExcessCharges = lazy(() => import("@/pages/tenant/excess-charges"));
const TenantMaintenance = lazy(() => import("@/pages/tenant/maintenance"));
const TenantDocuments = lazy(() => import("@/pages/tenant/documents"));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageShellSkeleton />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Landlord / Admin Portal */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="properties" element={<AdminProperties />} />
            <Route path="tenants" element={<AdminTenants />} />
            <Route path="utilities" element={<AdminUtilities />} />
            <Route path="billing" element={<AdminBilling />} />
            <Route path="invoices" element={<AdminInvoices />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="maintenance" element={<AdminMaintenance />} />
            <Route path="documents" element={<AdminDocuments />} />
          </Route>

          {/* Tenant Portal */}
          <Route path="/tenant" element={<TenantLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<TenantDashboard />} />
            <Route path="billing" element={<TenantBilling />} />
            <Route path="excess-charges" element={<TenantExcessCharges />} />
            <Route path="maintenance" element={<TenantMaintenance />} />
            <Route path="documents" element={<TenantDocuments />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

