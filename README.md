# AriRent — Rental & Property Management System

A full-stack property and rental management system built with **Laravel 12 (REST API)** and **React 19 + Vite (TypeScript + Tailwind CSS v4)**.

---

## 📖 System Documentation

- **[BACKEND.md](./BACKEND.md)** — Laravel 12 REST API layered architecture, database schema, and API endpoint documentation.
- **[FRONTEND.md](./FRONTEND.md)** — React 19 + Vite SPA feature-based architecture, role-based routing (Admin & Tenant portals), and component structure.

---

## 🏗️ Repository Architecture

```text
arirent-rental-system/
├── backend/            # Laravel 12 REST API (Layered Architecture)
│   └── app/
│       ├── Http/
│       │   ├── Controllers/   # Thin HTTP handlers (delegate to Services)
│       │   ├── Middleware/    # Role guard (EnsureAdmin)
│       │   ├── Requests/      # Form Request authorization & validation
│       │   └── Resources/     # Standardized JSON API Resources
│       ├── Services/          # Business logic & transactions
│       ├── Repositories/      # Contracts (interfaces) + Eloquent/Storage implementations
│       ├── Models/            # Eloquent ORM entities
│       ├── Exceptions/        # DomainException
│       ├── Support/           # PrivateFile signed-URL storage helper
│       └── Console/Commands/  # Artisan maintenance & reconciliation commands
├── frontend/           # React 19 + Vite SPA (Feature-Based Architecture)
│   └── src/
│       ├── pages/             # Thin route views (guest / admin / tenant)
│       ├── components/
│       │   ├── features/      # Domain components + custom hooks per feature
│       │   ├── common/        # Shared app shell (sidebar, headers, navigation)
│       │   └── ui/            # Reusable design-system primitives
│       ├── lib/
│       │   ├── services/      # Typed API service modules (only layer using Axios)
│       │   └── __tests__/     # Unit & architecture guard tests (Vitest)
│       └── styles/            # Tailwind CSS v4 theme & design tokens
├── BACKEND.md          # Backend API & Database Specs
├── FRONTEND.md         # Frontend UI & Routing Specs
├── .gitignore          # Root ignore rules
└── README.md           # Project guide
```

### Architecture Flow

- **Backend:** `Route → Middleware → Controller → Form Request → Service → Repository Interface → Repository → Model → API Resource`
- **Frontend:** `Page (Route) → Feature Components & Custom Hooks → API Service (lib/services/) → Axios Client (lib/axios.ts)`

Both boundaries are enforced automatically by `backend/tests/Feature/ArchitectureTest.php` and `frontend/src/lib/__tests__/architecture.test.ts`.

---

## 🚀 Quick Setup

### Backend (Laravel 12)
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve --port=3001
php artisan test
```

### Frontend (React 19 + Vite)
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
npm test
npm run build
```
