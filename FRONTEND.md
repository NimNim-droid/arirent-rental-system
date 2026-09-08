# AriRent Frontend — React + Vite + Tailwind CSS

## 1. Overview

The AriRent frontend is a **React 19 single-page application** built with **Vite**, **TypeScript**, and **Tailwind CSS v4**. It follows the same structural patterns as the [react-recipe-bsit3b](https://github.com/arielmaestrodev/react-recipe-bsit3b) template — a clean, role-based architecture using React Router for client-side navigation and Axios for API communication.

```
┌────────────────────────────────────────────────┐
│                  React SPA                      │
│                                                 │
│  ┌─────────┐  ┌──────────┐  ┌───────────────┐ │
│  │  Pages   │  │Components│  │  lib/api.ts   │ │
│  │ (routes) │  │ (UI/feat)│  │  (axios)      │ │
│  └────┬─────┘  └────┬─────┘  └───────┬───────┘ │
│       │              │                │          │
│       └──────────────┴────────────────┘          │
│                      │                           │
└──────────────────────┼───────────────────────────┘
                       │ HTTP (Axios)
                       ▼
              Laravel API (:3001)
```

---

## 2. Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | React 19 |
| Build Tool | Vite 8 |
| Language | TypeScript 6 |
| Styling | Tailwind CSS v4 |
| Routing | React Router v8 |
| HTTP Client | Axios |
| Class Utilities | clsx + tailwind-merge |
| Dev Server | Vite HMR |
| Containerization | Docker |

---

## 3. Project Structure

```
frontend/
├── src/
│   ├── assets/                          # Static images (SVG logos)
│   │   ├── arirent-mark.svg
│   │   ├── arirent-favicon.svg
│   │   └── gcash-qr-sample.svg
│   │
│   ├── components/
│   │   ├── ui/                          # Reusable UI primitives
│   │   │   ├── button.tsx               # Button with variants
│   │   │   ├── card.tsx                 # Glass-card container
│   │   │   ├── input.tsx                # Form input + label
│   │   │   ├── select.tsx               # Dropdown select
│   │   │   ├── textarea.tsx             # Multi-line input
│   │   │   ├── label.tsx                # Form label
│   │   │   ├── modal.tsx                # Overlay dialog
│   │   │   ├── badge.tsx                # Status badge
│   │   │   ├── table.tsx                # Data table wrapper
│   │   │   ├── toast.tsx                # Toast notifications
│   │   │   ├── empty-state.tsx          # Empty list/table state
│   │   │   ├── spinner.tsx              # Loading spinner
│   │   │   └── pagination.tsx           # Page navigation
│   │   │
│   │   ├── common/                      # Shared layout components
│   │   │   ├── page-loading.tsx         # Full-page loader
│   │   │   ├── sidebar.tsx              # Admin/tenant sidebar
│   │   │   ├── page-header.tsx          # Title + action button
│   │   │   ├── stats-card.tsx           # Dashboard stat card
│   │   │   └── search-filters.tsx       # Search bar + filter dropdowns
│   │   │
│   │   └── features/                    # Domain-specific components
│   │       ├── auth/
│   │       │   ├── login-form.tsx
│   │       │   └── register-form.tsx
│   │       ├── property/
│   │       │   ├── property-card.tsx
│   │       │   └── property-selector.tsx
│   │       ├── tenant/
│   │       │   ├── tenant-table.tsx
│   │       │   ├── tenant-detail-modal.tsx
│   │       │   ├── tenant-approval-card.tsx
│   │       │   └── tenant-actions.tsx
│   │       ├── billing/
│   │       │   ├── invoice-table.tsx
│   │       │   ├── invoice-modal.tsx
│   │       │   ├── gcash-payment-modal.tsx
│   │       │   ├── payment-verification-card.tsx
│   │       │   └── billing-stats.tsx
│   │       ├── maintenance/
│   │       │   ├── ticket-table.tsx
│   │       │   ├── ticket-form.tsx
│   │       │   ├── dispatch-modal.tsx
│   │       │   └── ticket-filters.tsx
│   │       ├── utilities/
│   │       │   ├── meter-reading-form.tsx
│   │       │   ├── water-rates-table.tsx
│   │       │   └── settings-form.tsx
│   │       └── documents/
│   │           ├── lease-viewer.tsx
│   │           └── house-rules-viewer.tsx
│   │
│   ├── lib/                             # Utilities & API layer
│   │   ├── axios.ts                     # Configured Axios instance
│   │   ├── cn.ts                        # clsx + twMerge helper
│   │   └── types.ts                     # TypeScript interfaces
│   │
│   ├── pages/                           # Route-based page components
│   │   ├── guest/                       # Public (unauthenticated)
│   │   │   ├── login/
│   │   │   │   └── index.tsx
│   │   │   └── register/
│   │   │       └── index.tsx
│   │   ├── admin/                       # Landlord dashboard
│   │   │   ├── layout.tsx               # Sidebar + <Outlet />
│   │   │   ├── dashboard/
│   │   │   │   └── index.tsx
│   │   │   ├── tenants/
│   │   │   │   └── index.tsx
│   │   │   ├── utilities/
│   │   │   │   └── index.tsx
│   │   │   ├── billing/
│   │   │   │   └── index.tsx
│   │   │   └── maintenance/
│   │   │       └── index.tsx
│   │   └── tenant/                      # Tenant portal
│   │       ├── layout.tsx               # Sidebar + <Outlet />
│   │       ├── dashboard/
│   │       │   └── index.tsx
│   │       ├── billing/
│   │       │   └── index.tsx
│   │       ├── maintenance/
│   │       │   └── index.tsx
│   │       └── documents/
│   │           └── index.tsx
│   │
│   ├── styles/
│   │   └── global.css                   # Tailwind imports + design tokens
│   │
│   ├── App.tsx                          # React Router root
│   └── main.tsx                         # Entry point
│
├── public/                              # Static assets served as-is
├── index.html                           # HTML shell
├── package.json
├── vite.config.ts                       # Vite + Tailwind + @ alias
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── eslint.config.js
├── Dockerfile
├── docker-compose.yaml
└── .env.example
```

---

## 4. Installation

### Prerequisites

- Node.js 20+ (see `.nvmrc`)
- npm or yarn
- Backend API running (see `../backend/README.md`)

### Quick Start

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### With Docker

```bash
# From the repo root, with backend stack already up
docker compose -f frontend/docker-compose.yaml up -d --build
```

The frontend container joins the backend's Docker network, so it reaches the API at `http://web` instead of `localhost:3001`.

### Scripts

```bash
npm run dev       # Development server (Vite HMR)
npm run build     # Production build (also type-checks)
npm run lint      # ESLint
npm run preview   # Preview production build locally
```

---

## 5. Configuration

### `vite.config.ts`

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
```

### `lib/axios.ts` — API Client

```ts
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001",
  headers: {
    "Content-Type": "application/json",
    accept: "application/json",
  },
});

// Attach Bearer token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("arirent_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses (redirect to login)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("arirent_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
```

### `lib/cn.ts` — Class Merging Utility

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### `.env.local`

```env
VITE_API_URL=http://localhost:3001
```

---

## 6. Routing

### `App.tsx` — Route Definitions

```tsx
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
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="tenants" element={<AdminTenants />} />
          <Route path="utilities" element={<AdminUtilities />} />
          <Route path="billing" element={<AdminBilling />} />
          <Route path="maintenance" element={<AdminMaintenance />} />
        </Route>

        {/* Tenant */}
        <Route path="/tenant" element={<TenantLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<TenantDashboard />} />
          <Route path="billing" element={<TenantBilling />} />
          <Route path="maintenance" element={<TenantMaintenance />} />
          <Route path="documents" element={<TenantDocuments />} />
        </Route>

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### Route Summary

| Path | Page | Role |
|------|------|------|
| `/login` | Sign In | Guest |
| `/register` | Tenant Registration | Guest |
| `/admin/dashboard` | Stats Overview | Admin |
| `/admin/tenants` | Tenant Management | Admin |
| `/admin/utilities` | Record Readings | Admin |
| `/admin/billing` | Invoice Management | Admin |
| `/admin/maintenance` | Ticket Dispatch | Admin |
| `/tenant/dashboard` | Tenant Overview | Tenant |
| `/tenant/billing` | My Bills | Tenant |
| `/tenant/maintenance` | Submit Tickets | Tenant |
| `/tenant/documents` | Lease & Rules | Tenant |

---

## 7. Component Patterns

### UI Primitives (`components/ui/`)

Each component follows the same pattern from react-recipe-bsit3b:

```tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn("rounded-xl border border-gray-200 bg-white/75 backdrop-blur shadow-sm", className)}>
      {children}
    </div>
  );
}
```

### Button Variants

```tsx
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
};

// primary:  bg-sky-600 text-white hover:bg-sky-700
// secondary: border border-gray-300 bg-white text-gray-700 hover:bg-gray-50
// danger:   bg-red-600 text-white hover:bg-red-700
```

### Modal Pattern

```tsx
<Modal open={showModal} onClose={() => setShowModal(false)} title="Edit Invoice">
  {/* Modal content */}
</Modal>
```

### Toast Notifications

```tsx
import { toast } from "@/components/ui/toast";

// Usage anywhere in the app
toast("Bill generated successfully!", "success");
toast("Failed to save settings.", "error");
toast("Payment pending verification.", "warning");
```

---

## 8. Pages

### 8.1 Guest — Login (`pages/guest/login/index.tsx`)

**Features:**

- Email/username + password form
- Quick Admin Access button (auto-fills admin credentials)
- Link to registration page

**API Calls:**

- `POST /api/login`

**On Success:**

- Stores token in `localStorage`
- Redirects to `/admin/dashboard` or `/tenant/dashboard` based on `role`

---

### 8.2 Guest — Register (`pages/guest/register/index.tsx`)

**Features:**

- Full name, email, phone, password fields
- Property dropdown (fetched from API)
- Room dropdown (filtered to vacant rooms in selected property)
- Password confirmation
- Success state with confirmation message

**API Calls:**

- `GET /api/properties`
- `GET /api/rooms?property_id=X&status=vacant`
- `POST /api/register`

---

### 8.3 Admin — Dashboard (`pages/admin/dashboard/index.tsx`)

**Features:**

- Property selector dropdown
- Stats cards: Total Revenue, Occupancy Rate, Pending Applications, Pending Payments
- Recent Maintenance Requests table (5 latest)

**API Calls:**

- `GET /api/properties`
- `GET /api/dashboard/stats?property_id=X`

---

### 8.4 Admin — Tenants (`pages/admin/tenants/index.tsx`)

**Features:**

- Pending Applications section with Approve/Decline buttons
- Active Residents table with search and status filter
- Tenant Detail modal (view all info)
- End Lease action
- Water rate editing

**API Calls:**

- `GET /api/tenants?status=pending_approval`
- `GET /api/tenants?status=active`
- `POST /api/tenants/{id}/approve`
- `POST /api/tenants/{id}/reject`
- `POST /api/tenants/{id}/vacate`
- `PUT /api/tenants/{id}`

---

### 8.5 Admin — Utilities (`pages/admin/utilities/index.tsx`)

**Features:**

- Electricity Meter Reading form (tenant dropdown, prev/curr readings, auto-calculated usage & amount)
- Water Fixed Rates table (edit per-tenant water rate)
- GCash & Payment Settings form (account name, number, electricity rate, QR image)

**API Calls:**

- `GET /api/tenants?status=active`
- `GET /api/readings?tenant_id=X`
- `POST /api/readings`
- `PUT /api/tenants/{id}` (water rate)
- `GET /api/settings`
- `PUT /api/settings`

---

### 8.6 Admin — Billing (`pages/admin/billing/index.tsx`)

**Features:**

- Generate Monthly Bills button
- Pending GCash Verifications section (approve/reject with reason)
- All Invoices table with search, filter by status
- Invoice detail modal (printable statement)
- Edit Invoice modal (rent, electricity, water, status)
- Bulk actions (mark paid/unpaid, delete)
- Receipt viewer modal

**API Calls:**

- `POST /api/bills/generate`
- `GET /api/bills?status=pending_verification`
- `GET /api/bills`
- `GET /api/bills/{id}`
- `PUT /api/bills/{id}`
- `DELETE /api/bills/{id}`
- `POST /api/bills/{id}/verify`

---

### 8.7 Admin — Maintenance (`pages/admin/maintenance/index.tsx`)

**Features:**

- Status filter pills (All, Pending, In Progress, Resolved) with counts
- Tickets table with category, priority badge, photo thumbnail
- Dispatch Technician modal (assign name, notes, update status)
- Mark Resolved action
- Photo inspector modal

**API Calls:**

- `GET /api/maintenance?status=X`
- `PUT /api/maintenance/{id}`
- `DELETE /api/maintenance/{id}`

---

### 8.8 Tenant — Dashboard (`pages/tenant/dashboard/index.tsx`)

**Features:**

- Identity bar (avatar initials, name, room, property)
- Current Balance card (all clear / balance due state)
- My Assigned Unit card (room, building, location)
- Utility Consumption card (latest reading, usage, rates)
- Recent Maintenance list (last 2 tickets)
- Quick links to other pages

**API Calls:**

- `GET /api/me`
- `GET /api/readings?tenant_id=X`
- `GET /api/maintenance?tenant_id=X`
- `GET /api/settings`
- `GET /api/properties`

---

### 8.9 Tenant — Billing (`pages/tenant/billing/index.tsx`)

**Features:**

- Outstanding Balance stat card
- Billing History table (all bills for this tenant)
- Invoice detail modal (printable)
- GCash Payment modal (QR code, reference input, receipt upload)
- CSV export of billing history

**API Calls:**

- `GET /api/bills?tenant_id=X`
- `GET /api/bills/{id}`
- `POST /api/bills/{id}/verify` (submit payment)
- `GET /api/settings`

---

### 8.10 Tenant — Maintenance (`pages/tenant/maintenance/index.tsx`)

**Features:**

- Submit Repair Ticket form (category, description, photo upload, urgency)
- My Tickets list (active and past, with status badges)
- Emergency Hotline card
- Photo viewer modal

**API Calls:**

- `GET /api/maintenance?tenant_id=X`
- `POST /api/maintenance`

---

### 8.11 Tenant — Documents (`pages/tenant/documents/index.tsx`)

**Features:**

- Lease Agreement card (personalized with room/name/dates)
- House Rules & Policies card
- Document viewer modal (rendered content)
- Print button

**API Calls:**

- `GET /api/me` (for personalization)

---

## 9. TypeScript Types (`lib/types.ts`)

```ts
export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "tenant";
}

export interface Property {
  id: string;
  name: string;
  city: string;
  address: string;
  rooms_count?: number;
  occupied_count?: number;
}

export interface Room {
  id: string;
  property_id: string;
  room_number: string;
  rent: number;
  status: "vacant" | "reserved" | "occupied";
  property?: Property;
}

export interface Tenant {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  property_id: string;
  property_name?: string;
  property_address?: string;
  room: string;
  status: "pending_approval" | "active" | "inactive";
  balance: number;
  water_rate: number;
  lease_end: string | null;
  vacated_date?: string;
}

export interface Bill {
  id: string;
  tenant_id: string;
  rent: number;
  electricity: number;
  elec_usage: number;
  water: number;
  late_fee: number;
  total_amount: number;
  date: string;
  due_date: string;
  status: "unpaid" | "pending_verification" | "paid";
  gcash_ref?: string;
  receipt_url?: string;
  notes?: string;
  payment_date?: string;
  approved_date?: string;
  reject_reason?: string;
}

export interface UtilityReading {
  id: string;
  tenant_id: string;
  prev_reading: number;
  curr_reading: number;
  usage_kwh: number;
  amount: number;
  date: string;
}

export interface MaintenanceTicket {
  id: string;
  tenant_id: string;
  property_id: string;
  room: string;
  type: "plumbing" | "electrical" | "appliances" | "general";
  description: string;
  photo_url: string;
  priority: "normal" | "urgent";
  status: "pending" | "in_progress" | "resolved";
  technician_name: string;
  admin_notes: string;
  resolved_date?: string;
  date: string;
}

export interface Settings {
  elec_rate: number;
  water_rate: number;
  gcash_name: string;
  gcash_number: string;
  gcash_qr_path: string;
}

export interface DashboardStats {
  total_revenue: number;
  occupancy_rate: number;
  occupied_rooms: number;
  total_rooms: number;
  pending_applications: number;
  pending_payments: number;
  recent_maintenance: MaintenanceTicket[];
}

export interface PaginatedResponse<T> {
  data: T[];
  links: { first: string; last: string; prev: string | null; next: string | null };
  meta: { current_page: number; per_page: number; total: number };
}
```

---

## 10. Authentication Flow

```
1. User submits login form
2. POST /api/login → { token, user }
3. Token stored in localStorage("arirent_token")
4. User object stored in localStorage("arirent_current_user")
5. Axios interceptor attaches Bearer token to all requests
6. React Router guards redirect to /login if no token
7. On 401 response → clear storage, redirect to /login
```

### Route Protection

```tsx
// In layout components (admin/layout.tsx, tenant/layout.tsx)
import { Navigate } from "react-router";

function AdminLayout() {
  const user = JSON.parse(localStorage.getItem("arirent_current_user") || "null");

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/tenant/dashboard" replace />;

  return (
    <div className="flex">
      <Sidebar role="admin" />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
```

---

## 11. Design System

### Tailwind Configuration (via `global.css`)

```css
@import "tailwindcss";

@theme {
  --color-primary: #0ea5e9;
  --color-primary-light: #38bdf8;
  --color-primary-dark: #0284c7;
  --color-primary-bg: #e0f2fe;

  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;

  --color-text-main: #0f172a;
  --color-text-muted: #64748b;

  --font-sans: "Outfit", system-ui, sans-serif;
}
```

### Component Styling

All components use the `cn()` utility for conditional Tailwind classes:

```tsx
<Card className={cn(
  "p-4",
  isActive && "border-sky-500",
  isDisabled && "opacity-50"
)}>
```

### Design Tokens from Original AriRent

| Token | Value | Tailwind Equivalent |
|-------|-------|---------------------|
| `--primary` | `#0ea5e9` | `sky-500` |
| `--primary-dark` | `#0284c7` | `sky-600` |
| `--success` | `#10b981` | `emerald-500` |
| `--warning` | `#f59e0b` | `amber-500` |
| `--danger` | `#ef4444` | `red-500` |
| `--text-main` | `#0f172a` | `slate-900` |
| `--text-muted` | `#64748b` | `slate-500` |

---

## 12. Docker Configuration

### Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

### docker-compose.yaml

```yaml
services:
  frontend:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - VITE_API_URL=http://web
    networks:
      - arirent-network

networks:
  arirent-network:
    external: true
```

---

## 13. Data Flow Example — Tenant Submits Maintenance Ticket

```
1. User fills form in TenantMaintenance page
      → type: "plumbing", description: "...", priority: "urgent"
2. TicketForm component calls onSubmit handler
3. Handler calls POST /api/maintenance via lib/axios.ts
      → Axios attaches Bearer token from localStorage
      → Request body: { tenant_id, type, description, priority }
4. Laravel API receives request
      → StoreMaintenanceRequest validates input
      → MaintenanceService creates ticket
      → MaintenanceRepository persists to database
      → Returns MaintenanceResource with 201 status
5. Frontend receives response
      → toast("Ticket submitted!", "success")
      → Refetch ticket list (re-render table)
      → Form resets
```

---

## 14. Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Test Structure

```bash
tests/
├── api.test.ts          # API client: query building, error handling
└── components.test.tsx  # UI components: badges, pagination, tables
```

---

## 15. Key Differences from Next.js

| Feature | Next.js | This Stack (React + Vite) |
|---------|---------|---------------------------|
| Rendering | SSR / SSG / RSC | Client-side only (SPA) |
| Routing | File-system based | Explicit in `App.tsx` |
| Data fetching | Server Components | `useEffect` + Axios |
| API calls | Server-side (no CORS) | Client-side (CORS applies) |
| Build | Next.js compiler | Vite + esbuild |
| State | Server/Client split | Client-only (localStorage, React state) |
| Auth | Middleware / cookies | localStorage + Axios interceptor |

---

## 16. Full Stack Startup

```bash
# Terminal 1 — Backend
cd backend
docker compose up -d --build
docker compose exec app php artisan migrate --seed
# API running at http://localhost:3001

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
# App running at http://localhost:3000

# Default Admin Login
# Email: admin@arirent.com
# Password: admin
```
