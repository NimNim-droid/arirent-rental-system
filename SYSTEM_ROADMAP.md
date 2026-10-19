# AriRent System: Step-by-Step Refactoring & Hardening Roadmap

> **Status:** Work in Progress  
> **Last Updated:** 2026-10-19 (audit: see "Fix Before New Work" below)  
> **Purpose:** Step-by-step checklist to bridge the gap between current Fat-Controller implementation and the documented Layered Architecture ([BACKEND.md](file:///c:/dev/rental-system/BACKEND.md) / [FRONTEND.md](file:///c:/dev/rental-system/FRONTEND.md)), patch critical security holes, and establish automated tests.

---

## Quick Resume Guide (For When You Return)

1. Open two terminals:
   * **Backend:** `cd backend && php artisan serve` (Runs on `http://127.0.0.1:8000`)
   * **Frontend:** `cd frontend && npm run dev` (Runs on `http://localhost:5173`)
2. Follow the checklist below sequentially from **Phase 1** to **Phase 6**.
3. Check off tasks as you complete them using `[x]`.

---

## Progress Overview

- [ ] **Phase 1: Critical Security & Logic Hotfixes (P0 - Immediate)** — mostly done; 1.4 partially fixed (see F-A3), new P0s found (F-A1, F-A2)
- [x] **Phase 2: API Contract Harmonization & API Resources (P1)**
- [ ] **Phase 3: Form Requests & Input Validation Hardening (P1)** — partial (see Group B)
- [ ] **Phase 4: Layered Architecture - Repositories & Services (P2)** — partial (see Group C)
- [x] **Phase 5: Automated Test Suite (P1/P2)** — 23 backend + 14 frontend tests passing
- [ ] **Phase 6: Production Hardening & Build Verification (P3)**

---

## 🚧 Fix Before New Work (Audit 2026-10-19, re-verified)

> Every item below was checked against the current code (file + line).
> Do the groups **in order**. Don't start new features until **Groups 0 → C** are done.
> After **every** item run: `cd backend && php artisan test` and `cd frontend && npm test`.

**Target architecture (from [BACKEND.md](file:///c:/dev/rental-system/BACKEND.md)):**
```
Route → Controller → Form Request (auth + validation) → Service (business rules)
      → Repository Interface → Eloquent Repository → Model → API Resource (JSON shape)
```
Rule of thumb: **Controllers** only receive the request, call one service method, and return a Resource.
**Services** contain rules and never call `Model::` directly. **Repositories** are the only place that queries the DB.

---

### Group 0 — Checkpoint
- [x] **F-0 Commit the current state** (all 37 tests are green right now)
  - **Why:** Every new Service, Repository, Request, Resource and test is still **untracked** in git. One bad edit could lose it.
  - **Steps:** `git add -A` → `git commit -m "refactor: layered architecture (phases 1-5)"`

---

### Group A — Security & Correctness (P0, do first)

- [x] **F-A1 A paid or voided bill can be paid again** (regression from the refactor)
  - **Where:** [`PaymentService::submitPayment`](file:///c:/dev/rental-system/backend/app/Services/PaymentService.php#L19-L50)
  - **Problem:** The old `BillController::pay` returned 422 when `status === 'paid'`. When the logic moved to the service, that check was dropped, and [`ProcessPaymentRequest`](file:///c:/dev/rental-system/backend/app/Http/Requests/Bill/ProcessPaymentRequest.php) only checks *ownership*, not *status*.
  - **What can go wrong:** Tenant pays → admin approves (balance −₱10,500) → tenant submits again on the same bill → status back to `pending_verification` → admin approves → balance −₱10,500 **again**.
  - **Fix steps:**
    1. In `submitPayment`, after the "not found" check, add: if `$bill->status` is `paid` or `voided` → `throw new \InvalidArgumentException('This invoice has already been paid.')` (or `'...has been voided.'`).
    2. Nothing to change in the controller. [`BillController::pay`](file:///c:/dev/rental-system/backend/app/Http/Controllers/BillController.php#L151-L172) already turns `InvalidArgumentException` into a 422.
  - **Test:** In `BillWorkflowTest`, add `test_cannot_pay_already_paid_bill` (expects 422 and an unchanged balance).

- [x] **F-A2 Any logged-in tenant can list/view all tenants** (data leak)
  - **Where:** [`TenantController::index` and `show`](file:///c:/dev/rental-system/backend/app/Http/Controllers/TenantController.php#L23-L76). Routes `GET /api/tenants` and `GET /api/tenants/{id}` only use `auth:sanctum`.
  - **Problem:** No role check, so a tenant can see every tenant's name, email, phone, balance, bills and tickets.
  - **Safe to restrict? Yes, checked:** The frontend calls `GET /tenants` only from **admin** pages (`admin/billing`, `admin/utilities`, `admin/tenants`). `GET /tenants/{id}` is not called by the frontend at all.
  - **Fix steps:**
    1. `index`: return 403 if `$request->user()->role !== 'admin'`.
    2. `show`: allow if admin; if tenant, allow only when the tenant record belongs to them (`user_id` matches), else 403.
    3. (Group B will later move these checks into Form Requests.)
  - **Test:** In `SecurityTest`, add `test_tenant_cannot_list_tenants` and `test_tenant_cannot_view_another_tenant_profile`.

- [x] **F-A3 The "one day early" date bug still exists in 2 places** (roadmap item 1.4 was only partly fixed)
  - **Where:**
    - [`create-bill-modal.tsx` line 35](file:///c:/dev/rental-system/frontend/src/components/features/billing/create-bill-modal.tsx#L35): `new Date().toISOString().split("T")[0]`
    - [`useUtilities.ts` line 9](file:///c:/dev/rental-system/frontend/src/components/features/utilities/hooks/useUtilities.ts#L9): `new Date().toISOString().slice(0, 10)`
  - **Problem:** `toISOString()` converts to UTC. In the Philippines (GMT+8), from 00:00 to 07:59 the UTC date is still *yesterday*, so the default bill/reading date is wrong.
  - **Fix steps:** Import `formatLocalDateString` from `@/lib/formatters` and use `formatLocalDateString()` in both places. The function already exists and is tested, but nothing uses it yet.
  - **Test:** Existing `formatters.test.ts` already covers the function. Run `npm test` and `npm run build`.

---

### Group B — Finish Phase 3 (Form Requests = authorization + validation)

Each item: create the Request class → move the `validate([...])` rules into `rules()` → move the `role !== 'admin'` check into `authorize()` → change the controller method's parameter type → delete the inline code.

- [x] **F-B1** `Property/UpdatePropertyRequest.php` → [`PropertyController::update`](file:///c:/dev/rental-system/backend/app/Http/Controllers/PropertyController.php) (currently inline validate + inline admin check)
- [x] **F-B2** `Room/UpdateRoomRequest.php` → [`RoomController::update`](file:///c:/dev/rental-system/backend/app/Http/Controllers/RoomController.php) (same)
- [x] **F-B3** `Bill/VerifyPaymentRequest.php` → [`BillController::verify`](file:///c:/dev/rental-system/backend/app/Http/Controllers/BillController.php) (`approved`, `reject_reason`)
- [x] **F-B4** `Tenant/ApproveTenantRequest.php` → [`TenantController::approve`](file:///c:/dev/rental-system/backend/app/Http/Controllers/TenantController.php#L99-L127) (`move_in_date`, `advance_paid`)
- [x] **F-B5** `Maintenance/StoreMaintenanceRequest.php` + `UpdateMaintenanceRequest.php` → [`MaintenanceController`](file:///c:/dev/rental-system/backend/app/Http/Controllers/MaintenanceController.php) `store` / `update`
- [x] **F-B6** `Settings/UpdateSettingsRequest.php` → [`SettingsController::update`](file:///c:/dev/rental-system/backend/app/Http/Controllers/SettingsController.php#L33-L45)
- [x] **F-B7** Add a unique rule for admin email edits in [`UpdateTenantRequest`](file:///c:/dev/rental-system/backend/app/Http/Requests/Tenant/UpdateTenantRequest.php#L48)
  - **Problem:** `tenants.email` is `unique` in the database, but the rule is only `nullable|email`. A duplicate email causes a database error (500) instead of a clear 422 message.
  - **Fix:** `Rule::unique('tenants', 'email')->ignore($this->route('id'))`.
- [ ] **F-B8** Unused Request files: [`Reading/UpdateReadingRequest.php`](file:///c:/dev/rental-system/backend/app/Http/Requests/Reading/UpdateReadingRequest.php) (no reading-update route exists) and [`Tenant/StoreTenantRequest.php`](file:///c:/dev/rental-system/backend/app/Http/Requests/Tenant/StoreTenantRequest.php) (tenants are created via `/register`). **Decide:** delete them, or keep them for a planned feature.

---

### Group C — Finish Phase 4 (Services & Repositories)

- [ ] **F-C1 `MaintenanceController` still talks to Models directly**
  - **Proof:** `MaintenanceRepositoryInterface` is bound in `AppServiceProvider` and tested in `ArchitectureTest`, but **no controller or service uses it**.
  - **Steps:** Create `app/Services/MaintenanceService.php` (list by role, create with photo upload, update with `resolved_date`, delete) → inject `MaintenanceRepositoryInterface` + `TenantRepositoryInterface` → make the controller call the service only.
- [ ] **F-C2 `SettingsController` is a fat controller**
  - **Steps:** Create `SettingsRepositoryInterface` + `EloquentSettingsRepository` (wrap `Setting::getGlobal()` / save) → `SettingsService` (rates, GCash, QR upload) → `SettingsResource` → bind in `AppServiceProvider`.
- [ ] **F-C3 `DashboardController` runs queries itself**
  - **Steps:** Create `DashboardService` with `adminStats(?propertyId)` and `tenantDashboard(User)`, and move the existing query code and cache keys there unchanged. Don't change the numbers it returns.
- [ ] **F-C4 Remove direct `Model::` calls inside Services** (add the needed repository methods):
  - [`UtilityService`](file:///c:/dev/rental-system/backend/app/Services/UtilityService.php#L45) → `Bill::where(...)` in `recordReading` and `deleteReading` → `billRepo->findForTenantInMonth(...)`
  - [`PropertyService::deleteProperty`](file:///c:/dev/rental-system/backend/app/Services/PropertyService.php#L71) → `Property::withCount(...)` → `propertyRepo->findWithOccupiedCount($id)`
  - [`TenantService::approveTenant`](file:///c:/dev/rental-system/backend/app/Services/TenantService.php#L102) → `Tenant::where(...)` → `tenantRepo->findActiveInRoom(...)`; `deleteTenant` → `User::where(...)->delete()`
  - [`BillService::generateMonthlyBills`](file:///c:/dev/rental-system/backend/app/Services/BillService.php#L184) → `Tenant::where(...)->increment(...)` → `tenantRepo->incrementBalance(...)`
  - `Setting::getGlobal()` in `BillService` / `UtilityService` → switch to `SettingsRepositoryInterface` after F-C2.
- [ ] **F-C5** Extend [`ArchitectureTest`](file:///c:/dev/rental-system/backend/tests/Feature/ArchitectureTest.php) with the new services/repositories.
- [ ] **F-C6 Make [BACKEND.md](file:///c:/dev/rental-system/BACKEND.md) match reality** (documentation drift)
  - BACKEND.md lists `RoomService`, `ReadingService`, `AuthService`, `MaintenanceService`, `SettingsService`, `DashboardService` and puts repositories directly in `app/Repositories/`.
  - The actual code uses `PropertyService` (properties + rooms), `UtilityService` (readings), `PaymentService`, and puts repositories in `app/Repositories/Eloquent/`.
  - **Decide:** update BACKEND.md to the real structure (recommended, less churn).
- [ ] **F-C7 (Optional)** `AuthController::register` creates `User` / `Tenant` / updates `Room` directly. Move this into an `AuthService` to complete the pattern.

---

### Group D — Billing Logic (P1, after Groups A–C)

- [ ] **F-D1 Electricity can be counted twice, depending on timing** ⚠️ needs your business decision
  - **Where:** [`BillService::generateMonthlyBills`](file:///c:/dev/rental-system/backend/app/Services/BillService.php#L153-L155) uses `getLatestReadingsForTenants()`, which has **no date filter**.
  - **Scenario:** Oct 20 reading is recorded → [`UtilityService::recordReading`](file:///c:/dev/rental-system/backend/app/Services/UtilityService.php#L45-L69) adds it to the **unpaid October bill**. Nov 5 bills are generated with no new reading → the **same Oct 20 reading** is added to the November bill too.
  - **Decide the rule first:** Is electricity billed in the **same** month as the reading, or the **next** month (in arrears)?
  - **Fix options:** (a) add `bill_id` to `utility_readings` and skip readings already attached to a bill; or (b) keep only one path: either auto-sync on reading *or* pick up at generation, not both.
- [ ] **F-D2 Deleting a reading can change a PAID bill**
  - **Where:** [`UtilityService::deleteReading`](file:///c:/dev/rental-system/backend/app/Services/UtilityService.php#L93-L95). The bill lookup has no `status` filter.
  - **Fix:** Only reverse on `unpaid` bills (same filter `recordReading` already uses).
- [ ] **F-D3 Multi-step money changes are not atomic**
  - **Where:** `recordReading`, `deleteReading` (UtilityService), `verifyPayment` (PaymentService), `createBill`, `deleteBill` (BillService). Each one updates a bill **and** the tenant balance with no `DB::transaction`.
  - **Fix:** Wrap each in `DB::transaction(...)` the same way `generateMonthlyBills` and the TenantService methods already are.
- [ ] **F-D4 Unify the balance floor rule** (low)
  - Void and delete use `min(balance, total)` (balance never below 0), but [`verifyPayment`](file:///c:/dev/rental-system/backend/app/Services/PaymentService.php#L72) and `updateBill` (paid) decrement without a floor. Pick one rule and apply it everywhere.
- [ ] **F-D5 Remove duplicated "find tenant for logged-in user" code** (low, cleanup)
  - The same `Tenant::where('user_id')->orWhere('email')` query is copied in `MaintenanceController`, `DashboardController`, `AuthController` and `ProcessPaymentRequest`. Use `TenantRepositoryInterface::findByUserIdOrEmail` everywhere.
  - Low risk today because `users.email` and `tenants.email` are both unique.

---

### Group E — Phase 6 (corrected)
- [ ] **F-E1 Storage symlink:** `backend/public/storage` shows no visible target from Windows (it was probably created inside Docker). Run `php artisan storage:link` where the app actually runs, then open an uploaded receipt URL to confirm it loads.
- [ ] **F-E2 CORS for production:** [`config/cors.php`](file:///c:/dev/rental-system/backend/config/cors.php#L22) has `allowed_origins => ['*']` hardcoded. Change it to `explode(',', env('CORS_ALLOWED_ORIGINS', '*'))` and add `CORS_ALLOWED_ORIGINS=` to `.env.example`.
  - Note: `SANCTUM_STATEFUL_DOMAINS` is **not** needed, because the frontend uses Bearer tokens ([`axios.ts` line 16](file:///c:/dev/rental-system/frontend/src/lib/axios.ts#L16)), not cookies.
- [ ] **F-E3 Indexes are mostly done already.** [`2026_09_12_000001_add_performance_indexes.php`](file:///c:/dev/rental-system/backend/database/migrations/2026_09_12_000001_add_performance_indexes.php) already indexes `bills`, `tenants`, `rooms` and `utility_readings`. Only `maintenance_tickets.status` is missing (optional, via a new migration).

---

### ✅ Verified working (no action needed)
- Admin-only: dashboard stats, bill generate/store/update/verify/delete, reading store/delete, maintenance update/delete, property/room store.
- IDOR protected: bill `show`, bill `pay`, reading `show`.
- Role-scoped lists: bills, readings, maintenance.
- Tenant self-update is limited to `phone` only.
- `npm run build`, `npm test` (14), `php artisan test` (23), `php artisan route:cache` all pass.

### 📌 Not a blocker (future)
- `DocumentController` stores documents in a JSON file (`storage/app/documents.json`), not in the database, so it sits outside the layered architecture. Revisit when documents need per-tenant access.

### ➡️ After all above are checked
Resume **Phase 6** below, then start new feature work.

---

## Phase 1: Critical Security & Logic Hotfixes (P0 - Immediate)

*Goal: Close critical authorization holes, IDOR vulnerabilities, timezone shifts, and cache bugs.*

### 1.1 Guard `TenantController::update` (Privilege Escalation)
- [x] **File:** [`backend/app/Http/Controllers/TenantController.php`](file:///c:/dev/rental-system/backend/app/Http/Controllers/TenantController.php#L137)
- **Problem:** Any logged-in tenant can hit `PUT /api/tenants/{id}` and modify their own `balance` to 0, change `room`, or alter `water_rate`.
- **Action:**
  - Verify `$request->user()->role === 'admin'`.
  - If role is `tenant`, reject with `403 Forbidden` or restrict fields to safe self-edits only (`emergency_contact`, `phone`).
  - Ensure tenants cannot update other tenants' profiles.

### 1.2 Guard `DashboardController::stats` (Data Leak)
- [x] **File:** [`backend/app/Http/Controllers/DashboardController.php`](file:///c:/dev/rental-system/backend/app/Http/Controllers/DashboardController.php#L22)
- **Problem:** `GET /api/dashboard/stats` has no admin check. Any tenant can query landlord revenue, total occupancy, pending apps, and system-wide tickets.
- **Action:**
  - Add guard:
    ```php
    if ($request->user()->role !== 'admin') {
        return response()->json(['message' => 'Unauthorized'], 403);
    }
    ```

### 1.3 Fix IDOR in `ReadingController::show` (IDOR Vulnerability)
- [x] **File:** [`backend/app/Http/Controllers/ReadingController.php`](file:///c:/dev/rental-system/backend/app/Http/Controllers/ReadingController.php#L167)
- **Problem:** Any authenticated tenant can view any utility reading by passing another tenant's reading ID.
- **Action:**
  - If `$user->role === 'tenant'`, verify that `$reading->room_id === $user->tenant?->room_id`. Return `403` if it does not match.

### 1.4 Fix GMT+8 Timezone Date-Shift (Due Date Off-By-One)
- [x] **File:** [`frontend/src/components/features/billing/create-bill-modal.tsx`](file:///c:/dev/rental-system/frontend/src/components/features/billing/create-bill-modal.tsx#L97)
- **Problem:** Calling `calculatedDueDate.toISOString().split('T')[0]` converts local midnight (GMT+8) to 16:00 UTC previous day, setting the due date one day early.
- **Action:**
  - Construct local date string explicitly:
    ```ts
    const formattedDue = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
    ```

### 1.5 Fix Client Cache Invalidation on Meter Reading
- [x] **File:** [`frontend/src/components/features/utilities/hooks/useUtilities.ts`](file:///c:/dev/rental-system/frontend/src/components/features/utilities/hooks/useUtilities.ts#L86)
- **Problem:** Recording a reading updates unpaid bills and tenant balances, but only `readings` and `dashboard` caches are invalidated.
- **Action:**
  - Add cache invalidations:
    ```ts
    clientCache.invalidate("readings");
    clientCache.invalidate("bills");
    clientCache.invalidate("tenants");
    clientCache.invalidate("dashboard");
    ```

---

## Phase 2: API Contract Harmonization & API Resources (P1)

*Goal: Standardize all backend responses with `{ "data": ... }` to match frontend expectations.*

### 2.1 Implement Laravel API Resources
Create and implement API Resources in `backend/app/Http/Resources/`:
- [x] `BillResource.php` - Map bill model, nested payments, room, and tenant.
- [x] `TenantResource.php` - Map tenant, room info, user account, and balances.
- [x] `ReadingResource.php` - Map utility reading, room, and rates.
- [x] `PropertyResource.php` - Map property and dynamic occupancy stats.
- [x] `RoomResource.php` - Map room, active tenant, and property details.
- [x] `MaintenanceResource.php` - Map ticket, status history, and tenant.

### 2.2 Verify Frontend Service Consumption
Audit API calls in [`frontend/src/lib/services/`](file:///c:/dev/rental-system/frontend/src/lib/services):
- [x] [`tenants.ts`](file:///c:/dev/rental-system/frontend/src/lib/services/tenants.ts) - Verify `res.data.data` receives expected resource structure.
- [x] [`billing.ts`](file:///c:/dev/rental-system/frontend/src/lib/services/billing.ts) - Verify invoice and payment payloads.
- [x] [`utilities.ts`](file:///c:/dev/rental-system/frontend/src/lib/services/utilities.ts) - Verify readings response payload.

---

## Phase 3: Form Requests & Input Validation Hardening (P1)

*Goal: Eliminate controller inline validation and enforce authorization rules at the request level.*

### 3.1 Create Domain Form Requests
Create Form Requests under `backend/app/Http/Requests/`:
- [x] **Tenant Domain:**
  - `Tenant/StoreTenantRequest.php`
  - `Tenant/UpdateTenantRequest.php`
- [x] **Billing Domain:**
  - `Bill/StoreBillRequest.php`
  - `Bill/UpdateBillRequest.php`
  - `Bill/ProcessPaymentRequest.php`
  - `Bill/GenerateBillsRequest.php`
- [x] **Utility Domain:**
  - `Reading/StoreReadingRequest.php`
  - `Reading/UpdateReadingRequest.php`
- [x] **Property & Room Domain:**
  - `Property/StorePropertyRequest.php`
  - `Room/StoreRoomRequest.php`

### 3.2 Implement `authorize()` Logic
- [x] Ensure administrative endpoints return `false` in `authorize()` if `$this->user()?->role !== 'admin'`.

---

## Phase 4: Layered Architecture - Repositories & Services (P2)

*Goal: Transition from Fat Controllers to the clean architecture defined in `BACKEND.md`.*

```
Route ──► Controller ──► Form Request ──► Service ──► Repository Contract ──► Repository ──► Model ──► API Resource
```

### 4.1 Define Repository Contracts & Implementations
Under `backend/app/Repositories/`:
- [x] Contracts in `backend/app/Repositories/Contracts/`:
  - `TenantRepositoryInterface.php`
  - `BillRepositoryInterface.php`
  - `ReadingRepositoryInterface.php`
  - `PropertyRepositoryInterface.php`
  - `RoomRepositoryInterface.php`
  - `MaintenanceRepositoryInterface.php`
- [x] Eloquent Implementations in `backend/app/Repositories/Eloquent/`:
  - Implement CRUD, pagination, and relational scopes (`with()`).
- [x] Bind in [`backend/app/Providers/AppServiceProvider.php`](file:///c:/dev/rental-system/backend/app/Providers/AppServiceProvider.php).

### 4.2 Extract Domain Services
Under `backend/app/Services/`:
- [x] `BillService.php`:
  - Batch generation logic (anniversary billing dates, overdue detection, late fee computation).
  - Bill voiding and balance recalculation.
- [x] `PaymentService.php`:
  - Payment proof upload & storage.
  - Approve payment (decrement tenant balance, mark bill `paid`).
  - Reject payment (reset bill to `unpaid`, set `reject_reason`).
- [x] `UtilityService.php`:
  - Consumption delta calculation (`present - previous`).
  - Auto-append utility charges to current month's unpaid invoice.
- [x] `TenantService.php`:
  - Tenant registration, document handling, room assignment checks, balance updates.
- [x] `PropertyService.php`:
  - Property and room CRUD, occupancy checks, and cache invalidation.

### 4.3 Refactor Controllers into Slim Controllers
- [x] Replace Eloquent queries in `BillController`, `TenantController`, `ReadingController`, and `PropertyController` with injected Services and API Resources.


---

## Phase 5: Automated Testing Suite (P1/P2)

*Goal: Prevent regressions and verify business logic.*

### 5.1 Backend Feature Tests (`php artisan test`)
Add feature test suites under `backend/tests/Feature/`:
- [x] `AuthTest.php`: Login, token generation, rejection of `pending_approval` tenants.
- [x] `SecurityTest.php`: Confirm tenants receive 403 on admin routes (Dashboard stats, tenant update, reading IDOR).
- [x] `BillWorkflowTest.php`: Generate bill ➔ Submit payment ➔ Approve payment ➔ Verify tenant balance decreased.
- [x] `UtilityReadingTest.php`: Submit reading ➔ Check consumption math ➔ Verify auto-update on unpaid bill.
- [x] `ArchitectureTest.php`: Verify Repository and Service container bindings.

### 5.2 Frontend Unit Tests (`npm test`)
- [x] Setup Vitest environment in `frontend/vitest.config.ts`.
- [x] Test date utility formatting (verifying correct calendar day regardless of local timezone).
- [x] Test client cache invalidation logic.


---

## Phase 6: Production Hardening & Build Verification (P3)

*Goal: Ready for deployment.*

- [ ] Check database foreign key indexes (`tenant_id`, `room_id`, `property_id`, `status`, `due_date`).
- [ ] Verify file storage symlink (`php artisan storage:link`).
- [ ] Verify production builds:
  ```bash
  # In backend/
  php artisan config:cache
  php artisan route:cache

  # In frontend/
  npm run build
  ```
- [ ] Ensure `.env.example` has all needed configurations (Sanctum stateful domains, CORS, app key).

---

## Useful Verification Commands

```bash
# Run backend tests
cd backend && php artisan test

# Check all routes & controller mappings
cd backend && php artisan route:list

# Run frontend build check (TypeScript & bundle verification)
cd frontend && npm run build

# Run frontend unit tests
cd frontend && npm test
```
