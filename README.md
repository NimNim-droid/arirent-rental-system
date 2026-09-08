# AriRent — Rental & Property Management System

A full-stack property and rental management system built with **Laravel 11 (REST API)** and **React 19 + Vite (Tailwind CSS v4)**.

---

## 📖 System Documentation

- **[BACKEND.md](./BACKEND.md)** — Laravel 11 REST API architecture, database schema, layered structure, and complete API endpoint documentation.
- **[FRONTEND.md](./FRONTEND.md)** — React 19 + Vite SPA architecture, Tailwind CSS v4 design tokens, role-based routing (Admin & Tenant portals), and component specs.

---

## 🏗️ Repository Architecture

```text
arirent-rental-system/
├── backend/            # Laravel 11 REST API
├── frontend/           # React 19 + Vite SPA
├── BACKEND.md          # Backend API & Database Specs
├── FRONTEND.md         # Frontend UI & Routing Specs
├── .gitignore          # Root ignore rules
└── README.md           # Project guide
```

---

## 👥 Team Collaboration Workflow

### 1. Branching Strategy
- **`main`** is protected — never commit or push directly to `main`.
- Create a new feature branch for each task:
  ```bash
  git checkout main
  git pull origin main
  git checkout -b feature/your-feature-name
  ```

### 2. Branch Naming
- `feature/auth-login`
- `feature/backend-tenants-api`
- `feature/billing-gcash-verification`
- `feature/maintenance-tickets`
- `fix/room-status-sync`

### 3. Pull Requests (PRs)
1. Push branch to GitHub:
   ```bash
   git push -u origin feature/your-feature-name
   ```
2. Open a Pull Request into `main`.
3. Have at least one teammate review and approve before merging.

---

## 🚀 Quick Setup (Overview)

### Backend (Laravel 11)
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

### Frontend (React 19 + Vite)
```bash
cd frontend
npm install
npm run dev
```
