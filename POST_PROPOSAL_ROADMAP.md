# AriRent: Post-Proposal Improvements Roadmap & Implementation Guide

> **Status:** Active Execution  
> **Target:** Post-Proposal / Prototype Defense Reporting Upgrades  
> **Lead Integrator:** Nimrod Cambalon  
> **Last Updated:** 2026-10-20  

This document serves as the persistent single source of truth for the post-proposal upgrades. If you restart your computer or IDE, resume directly from the checklist below.

---

## 👥 Team Resource Allocation

### 💻 Laptop Core Development Team (4 Members)
1. **Nimrod Cambalon (Leader):** Lead Architect, Integration, PR Reviews, Auth/KYC & Database Coordinator.
2. **Yasu Hiro Chiba:** Fullstack Lead, Mobile/Tablet Responsiveness, UI/UX, Maintenance Daily Quota.
3. **Felvin Baguio:** Payment Gateway Lead (PayMongo checkout, webhooks, receipts, idempotency).
4. **John Wendill Gianan:** Financial Reports & Billing Lead (Reports page, Billing vs. Invoices separation).

### 📱 Critical Documentation, QA & Defense Team (8 Members - Non-Laptop)
5. **Jerel Casinio:** Lead Author — Written Proposal Part 1 (Problem Statement, Objectives, Success Metrics, Scope).
6. **Thomas Patalinghug:** Lead Author — Written Proposal Part 2 (Proposed Solution, Methodology, Evaluation, Deployment).
7. **Jan Khevin Ligan:** Lead Designer — Defense Presentation Deck (Architecture, ERD, Schema, Figma/UI Walkthrough).
8. **Rexon Villagracia:** Lead Director — Defense Presentation Deck (Pitch, Live Demo Script, Testing Results, Limitations).
9. **Juvelyn Celocia:** Quality Assurance — Mobile Usability & UI Bug Log Sheet (testing on iOS/Android).
10. **Simon Joy Inso:** Quality Assurance — Financial Math & Test Case Matrix (ISO 25010 verification).
11. **Markjohn Bongo:** Media & Seed Data — Realistic Sub-meter Photos, Water Photos & 6-month Master Data Sheet.
12. **Jeremy Ando:** Official Documents — Standard Lease Agreement, House Rules & Delinquency Policy PDFs.

---

## 🏗️ The 8 Implementation Phases (Checklist)

### Phase 1: Database Foundation & Migrations (Backend)
- [x] **1.1** Create migration for `payments` table:
  - `id`, `bill_id`, `tenant_id`, `amount`, `payment_method` (`gcash`, `card`), `transaction_reference`, `status` (`pending`, `confirmed`, `failed`), `paid_at`.
- [x] **1.2** Update `bills` table migration:
  - Add `paid_amount` (`decimal(10,2)` default `0.00`).
  - Add `remaining_balance` (`decimal(10,2)` default `0.00`).
  - Update status enum: `['unpaid', 'partially_paid', 'paid', 'overdue', 'voided']`.
- [x] **1.3** Create migration for `excess_charges` table:
  - `id`, `tenant_id`, `bill_id` (nullable), `title`, `description`, `amount`, `status` (`pending`, `billed`, `paid`).
- [x] **1.4** Update `utility_readings` table:
  - Add `meter_photo_url` (`string`, nullable) for electric and water sub-meter photographic proof.
- [x] **1.5** Run `php artisan migrate` and verify with `php artisan test`.

### Phase 2: Billing Engine, Partial Payments & 2-Month Delinquency (Backend)
- [x] **2.1** Update `BillService::calculateTotal()`:
  - Formula: $\text{Rent} + \text{Electricity} + \text{Water} + \text{Excess Charges} + \text{Late Fees}$.
- [x] **2.2** Implement partial payment deduction in `PaymentService`:
  - Deduct confirmed payment from `remaining_balance`.
  - If `remaining_balance == 0` $\rightarrow$ status = `paid`.
  - If `remaining_balance > 0` $\rightarrow$ status = `partially_paid`.
- [x] **2.3** Implement 2-month unpaid delinquency query:
  - Check active tenants with $\ge 2$ consecutive unpaid monthly invoices.
  - Return alert flag for Admin Dashboard.
- [x] **2.4** Implement late penalty calculation logic based on invoice `due_date`.
- [x] **2.5** Write automated feature tests for partial payments and 2-month delinquency alerts.

### Phase 3: Payment Gateway Integration (PayMongo Sandbox)
- [ ] **3.1** Add PayMongo configuration in `config/services.php` and `.env.example`:
  - `PAYMONGO_SECRET_KEY`, `PAYMONGO_PUBLIC_KEY`, `PAYMONGO_WEBHOOK_SECRET`.
- [ ] **3.2** Build `PaymentGatewayService`:
  - Method `createCheckoutSession(Bill $bill, float $amount)`:
    - Generates PayMongo checkout session with GCash, Card, and PayMaya options.
    - Sets redirect URLs (`/tenant/billing?payment=success`, `/tenant/billing?payment=cancelled`).
- [ ] **3.3** Build Webhook Controller `POST /api/webhooks/paymongo`:
  - Verify webhook signature.
  - Listen for `checkout_session.payment.paid`.
  - Update bill balances, create payment record, generate receipt.
  - Add idempotency check using `transaction_reference` to prevent double-charging.

### Phase 4: Maintenance Quota (3/Day) & KYC Security (Backend)
- [ ] **4.1** Enforce 3-ticket daily limit per tenant in `StoreMaintenanceRequest` / `MaintenanceService`:
  - Query: `where('tenant_id', $tenantId)->whereDate('created_at', today())->count() < 3`.
  - Reject 4th ticket with HTTP 422 and return urgent manager contact info.
- [ ] **4.2** Add endpoint `GET /api/maintenance/daily-quota` to return used and remaining tickets for today.
- [ ] **4.3** Decouple email verification from identity verification (KYC):
  - Standard email verification (`email_verified_at`).
  - Secure KYC document storage (`private` disk) with admin review endpoints (`approve` / `reject`).

### Phase 5: Transactional Email Infrastructure (Backend)
- [ ] **5.1** Configure Laravel Mail settings (SMTP / Mailtrap).
- [ ] **5.2** Create Mailables and Blade templates:
  - `InvoiceIssuedMail`: New invoice with breakdown and secure payment link.
  - `PaymentReceiptMail`: Confirmed payment receipt with transaction reference.
  - `PaymentOverdueMail`: Notice of overdue bill with penalty details.
  - `MaintenanceStatusMail`: Ticket status update notifications.

### Phase 6: Admin Frontend Upgrades (React)
- [x] **6.1** Separate Billing from Invoices:
  - Update `/admin/billing`: Preparation workspace (meter inputs, meter photo uploads, excess charges, review & generate).
  - Create `/admin/invoices`: Official ledger (filter by paid/partially paid/unpaid/overdue, view/print invoice modal, direct offline payment recording, 2-month delinquency alerts).
- [ ] **6.2** Create Statistics & Reports Page (`/admin/reports`):
  - Confirmed revenue collected metrics (Weekly, Monthly, Yearly).
  - Outstanding balance KPI cards.
  - Breakdown counts of paid, pending, partially paid, and overdue invoices.
  - Date range filters.

### Phase 7: Tenant Frontend Upgrades & Mobile Responsiveness (React)
- [ ] **7.1** Update Tenant Invoices page:
  - [x] Add Partial Payment input field (pay custom amount up to remaining balance with preset chips).
  - [ ] Connect "Pay Now" to PayMongo checkout redirect (Phase 3).
  - [x] Add Payment History & Balance Breakdown view in Statement modal.
- [x] **7.2** Create Tenant Excess Charges Page (`/tenant/excess-charges`):
  - Itemized table of non-rent charges with dates and attached invoice numbers.
- [ ] **7.3** System-Wide Mobile Responsiveness:
  - Add mobile hamburger drawer navigation in `layout.tsx`.
  - Convert overflowing tables to mobile-friendly cards on `< 768px`.
  - Optimize touch target buttons ($44\text{px}+$) and responsive modals.

### Phase 8: End-to-End Testing & Defense Rehearsal
- [ ] **8.1** Run full test suite: `php artisan test` and `npm test`.
- [ ] **8.2** Verify all 8 non-laptop members have finished their deliverables (Proposal Doc, Slides, Diagrams, Test Matrices).
- [ ] **8.3** Conduct mock defense run-through with the working system.

---

## 🛡️ Git Safety Rules for Nimrod (Team Leader)

1. **Rule 1:** Never push directly to `main`.
2. **Rule 2:** Create one feature branch per phase or task:
   `git checkout -b feature/phase1-database-updates`
3. **Rule 3:** Merge your feature branch into `main` only when all tests pass:
   `git checkout main` $\rightarrow$ `git merge feature/phase1-database-updates`
4. **Rule 4:** If a classmate submits a PR, review it first. You have full power over the merge button!
