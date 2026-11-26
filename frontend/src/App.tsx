import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router";
import { PageLoading } from "@/components/common/page-loading";
import { useAuth } from "@/lib/auth-context";

// Layouts (loaded statically so shell renders without chunk delay)
import PublicLayout from "@/pages/guest/layout";
import AdminLayout from "@/pages/admin/layout";
import TenantLayout from "@/pages/tenant/layout";

// Lazy-loaded public listing & guest pages
const PublicListingsPage = lazy(() => import("@/pages/guest/listings"));
const PublicPropertiesPage = lazy(() => import("@/pages/guest/properties"));
const PublicPropertyDetailPage = lazy(() => import("@/pages/guest/property-detail"));
const PublicRoomDetailPage = lazy(() => import("@/pages/guest/room-detail"));
const LoginPage = lazy(() => import("@/pages/guest/login"));
const RegisterPage = lazy(() => import("@/pages/guest/register"));

// Lazy-loaded admin portal pages
const AdminDashboard = lazy(() => import("@/pages/admin/dashboard"));
const AdminProperties = lazy(() => import("@/pages/admin/properties"));
const AdminPropertyListing = lazy(() => import("@/pages/admin/property-listing"));
const AdminInquiries = lazy(() => import("@/pages/admin/inquiries"));
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
const TenantMaintenance = lazy(() => import("@/pages/tenant/maintenance"));
const TenantDocuments = lazy(() => import("@/pages/tenant/documents"));

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const targetId = hash.slice(1);
      const scroll = () => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          return true;
        }
        return false;
      };
      if (!scroll()) {
        const timer = setTimeout(scroll, 120);
        return () => clearTimeout(timer);
      }
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash]);

  return null;
}

export default function App() {
  const { initializing } = useAuth();

  if (initializing) {
    return <PageLoading />;
  }

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<PageLoading />}>
        <Routes>
          {/* Public Property Showcase & Viewing Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<PublicListingsPage />} />
            <Route path="/properties" element={<PublicPropertiesPage />} />
            <Route path="/properties/:id" element={<PublicPropertyDetailPage />} />
            <Route path="/rooms/:id" element={<PublicRoomDetailPage />} />
          </Route>

          {/* Guest Auth & Room Application Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Landlord / Admin Portal */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="properties" element={<AdminProperties />} />
            <Route path="properties/:id/listing" element={<AdminPropertyListing />} />
            <Route path="inquiries" element={<AdminInquiries />} />
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
            <Route path="excess-charges" element={<Navigate to="/tenant/billing" replace />} />
            <Route path="maintenance" element={<TenantMaintenance />} />
            <Route path="documents" element={<TenantDocuments />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
