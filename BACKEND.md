# AriRent Backend — Laravel REST API

## 1. Overview

The AriRent backend is a **Laravel 11 REST API** built with strict **Layered Architecture**. It serves as the data and business logic engine for the Rental & Property Management System, handling properties, tenants, billing, utilities, maintenance, and settings.

```
HTTP REQUEST
     │
     ▼
API ROUTE
     │
     ▼
┌──────────────┐
│  Controller  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Form Request │
└──────────────┘
       │
       ▼
┌──────────────┐
│   Service    │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ Repository Interface │
└──────────┬───────────┘
           │
           ▼
┌──────────────┐
│  Repository  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Eloquent   │
│    Model     │
└──────┬───────┘
       │
       ▼
    DATABASE
```

---

## 2. Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | Laravel 11 |
| PHP Version | 8.2+ |
| Database | MySQL 8.0 |
| Authentication | Laravel Sanctum |
| Containerization | Docker + Docker Compose |
| Web Server | Nginx (via Docker) |
| PHP Runtime | PHP-FPM |
| Testing | PHPUnit |
| Package Manager | Composer |

---

## 3. Project Structure

```
backend/
├── app/
│   ├── Exceptions/
│   │   └──InsufficientAgeException.php
│   │
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── AuthController.php
│   │   │   ├── PropertyController.php
│   │   │   ├── RoomController.php
│   │   │   ├── TenantController.php
│   │   │   ├── BillController.php
│   │   │   ├── ReadingController.php
│   │   │   ├── MaintenanceController.php
│   │   │   ├── SettingsController.php
│   │   │   └── DashboardController.php
│   │   │
│   │   ├── Requests/
│   │   │   ├── Auth/
│   │   │   │   ├── LoginRequest.php
│   │   │   │   └── RegisterRequest.php
│   │   │   ├── Property/
│   │   │   │   └── StorePropertyRequest.php
│   │   │   ├── Room/
│   │   │   │   └── StoreRoomRequest.php
│   │   │   ├── Tenant/
│   │   │   │   ├── StoreTenantRequest.php
│   │   │   │   └── UpdateTenantRequest.php
│   │   │   ├── Bill/
│   │   │   │   ├── StoreBillRequest.php
│   │   │   │   └── UpdateBillRequest.php
│   │   │   ├── Reading/
│   │   │   │   └── StoreReadingRequest.php
│   │   │   ├── Maintenance/
│   │   │   │   ├── StoreMaintenanceRequest.php
│   │   │   │   └── UpdateMaintenanceRequest.php
│   │   │   └── Settings/
│   │   │       └── UpdateSettingsRequest.php
│   │   │
│   │   └── Resources/
│   │       ├── PropertyResource.php
│   │       ├── RoomResource.php
│   │       ├── TenantResource.php
│   │       ├── BillResource.php
│   │       ├── ReadingResource.php
│   │       ├── MaintenanceResource.php
│   │       ├── SettingsResource.php
│   │       └── DashboardResource.php
│   │
│   ├── Models/
│   │   ├── Property.php
│   │   ├── Room.php
│   │   ├── Tenant.php
│   │   ├── User.php
│   │   ├── Bill.php
│   │   ├── UtilityReading.php
│   │   ├── MaintenanceTicket.php
│   │   └── Setting.php
│   │
│   ├── Repositories/
│   │   ├── Contracts/
│   │   │   ├── PropertyRepositoryInterface.php
│   │   │   ├── RoomRepositoryInterface.php
│   │   │   ├── TenantRepositoryInterface.php
│   │   │   ├── BillRepositoryInterface.php
│   │   │   ├── ReadingRepositoryInterface.php
│   │   │   ├── MaintenanceRepositoryInterface.php
│   │   │   └── SettingsRepositoryInterface.php
│   │   │
│   │   ├── PropertyRepository.php
│   │   ├── RoomRepository.php
│   │   ├── TenantRepository.php
│   │   ├── BillRepository.php
│   │   ├── ReadingRepository.php
│   │   ├── MaintenanceRepository.php
│   │   └── SettingsRepository.php
│   │
│   ├── Services/
│   │   ├── AuthService.php
│   │   ├── PropertyService.php
│   │   ├── RoomService.php
│   │   ├── TenantService.php
│   │   ├── BillService.php
│   │   ├── ReadingService.php
│   │   ├── MaintenanceService.php
│   │   ├── SettingsService.php
│   │   └── DashboardService.php
│   │
│   └── Providers/
│       └── AppServiceProvider.php
│
├── bootstrap/
├── config/
├── database/
│   ├── migrations/
│   │   ├── 0001_01_01_000000_create_users_table.php
│   │   ├── 2026_09_07_000001_create_properties_table.php
│   │   ├── 2026_09_07_000002_create_rooms_table.php
│   │   ├── 2026_09_07_000003_create_tenants_table.php
│   │   ├── 2026_09_07_000004_create_utility_readings_table.php
│   │   ├── 2026_09_07_000005_create_bills_table.php
│   │   ├── 2026_09_07_000006_create_maintenance_tickets_table.php
│   │   └── 2026_09_07_000007_create_settings_table.php
│   └── seeders/
│       └── AriRentDatabaseSeeder.php
│
├── docker/
│   ├── nginx/
│   │   └── default.conf
│   └── php/
│       └── local.ini
│
├── public/
├── resources/
├── routes/
│   ├── api.php
│   └── web.php
│
├── storage/
├── tests/
│   ├── Feature/
│   │   ├── AuthApiTest.php
│   │   ├── PropertyApiTest.php
│   │   ├── TenantApiTest.php
│   │   ├── BillApiTest.php
│   │   ├── ReadingApiTest.php
│   │   ├── MaintenanceApiTest.php
│   │   └── SettingsApiTest.php
│   └── Unit/
│       └── ArchitectureBindingTest.php
│
├── .dockerignore
├── .editorconfig
├── .env.example
├── .gitattributes
├── .gitignore
├── Dockerfile
├── README.md
├── artisan
├── composer.json
├── composer.lock
├── docker-compose.yaml
├── docker-compose.prod.yaml
├── package.json
├── phpunit.xml
└── vite.config.js
```

---

## 4. Installation

### Prerequisites

- PHP 8.2+
- Composer
- MySQL 8.0 (or via Docker)
- Docker & Docker Compose (recommended)

### Quick Start with Docker

```bash
# Clone the repository
git clone https://github.com/NimNim-droid/arirent-rental-system.git
cd arirent-rental-system/backend

# Copy environment file
cp .env.example .env

# Start Docker containers
docker compose up -d --build

# Install PHP dependencies
docker compose exec app composer install

# Generate application key
docker compose exec app php artisan key:generate

# Run database migrations
docker compose exec app php artisan migrate

# Seed initial data (properties, rooms, admin user)
docker compose exec app php artisan db:seed

# Run tests
docker compose exec app php artisan test
```

The API will be available at `http://localhost:3001/api`

### Local Development (without Docker)

```bash
# Install dependencies
composer install

# Configure .env
cp .env.example .env
php artisan key:generate

# Edit .env for your MySQL credentials
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=arirent
# DB_USERNAME=root
# DB_PASSWORD=

# Run migrations & seed
php artisan migrate --seed

# Start development server
php artisan serve
```

---

## 5. Database Schema

### users
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| name | string | |
| email | string | Unique |
| password | string | Hashed |
| role | enum | admin, tenant |
| created_at | timestamp | |
| updated_at | timestamp | |

### properties
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| name | string | Building name |
| city | string | |
| address | string | Full address |
| created_at | timestamp | |
| updated_at | timestamp | |

### rooms
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| property_id | uuid | FK → properties |
| room_number | string | e.g. "101", "502" |
| rent | decimal | Monthly rent in PHP |
| status | enum | vacant, reserved, occupied |
| created_at | timestamp | |
| updated_at | timestamp | |

### tenants
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | FK → users (nullable) |
| username | string | Unique login handle |
| name | string | Full name |
| email | string | Unique |
| phone | string | Contact number |
| password | string | Hashed |
| property_id | uuid | FK → properties |
| room | string | Room number assigned |
| status | enum | pending_approval, active, inactive |
| balance | decimal | Outstanding amount |
| water_rate | decimal | Per-tenant water rate |
| lease_end | date | Lease expiration |
| vacated_date | timestamp | When tenant left |
| created_at | timestamp | |
| updated_at | timestamp | |

### utility_readings
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| tenant_id | uuid | FK → tenants |
| prev_reading | decimal | Previous kWh reading |
| curr_reading | decimal | Current kWh reading |
| usage_kwh | decimal | Computed usage |
| amount | decimal | Computed cost |
| date | date | Reading date |
| created_at | timestamp | |
| updated_at | timestamp | |

### bills
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| tenant_id | uuid | FK → tenants |
| rent | decimal | |
| electricity | decimal | |
| elec_usage | decimal | kWh consumed |
| water | decimal | |
| late_fee | decimal | ₱250 after 30 days |
| total_amount | decimal | Sum of all charges |
| date | date | Billing date |
| due_date | date | Payment deadline |
| status | enum | unpaid, pending_verification, paid |
| gcash_ref | string | GCash reference number |
| receipt_url | string | Proof of payment path |
| notes | string | |
| payment_date | timestamp | |
| approved_date | timestamp | |
| reject_reason | string | |
| created_at | timestamp | |
| updated_at | timestamp | |

### maintenance_tickets
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| tenant_id | uuid | FK → tenants |
| property_id | uuid | FK → properties |
| room | string | |
| type | enum | plumbing, electrical, appliances, general |
| description | text | |
| photo_url | string | |
| priority | enum | normal, urgent |
| status | enum | pending, in_progress, resolved |
| technician_name | string | Assigned tech |
| admin_notes | text | |
| resolved_date | timestamp | |
| created_at | timestamp | |
| updated_at | timestamp | |

### settings
| Column | Type | Notes |
|--------|------|-------|
| id | bigint | Primary key (singleton) |
| elec_rate | decimal | ₱ per kWh |
| water_rate | decimal | Fixed monthly water fee |
| gcash_name | string | GCash account name |
| gcash_number | string | GCash mobile number |
| gcash_qr_path | string | QR image path |
| created_at | timestamp | |
| updated_at | timestamp | |

---

## 6. API Documentation

### Base URL

```
http://localhost:3001/api
```

### Authentication

All endpoints except `POST /api/login` and `POST /api/register` require a Bearer token:

```
Authorization: Bearer {token}
```

---

### 6.1 Auth

#### `POST /api/register` — Tenant Registration

**Request Body:**

```json
{
    "name": "Maria Santos",
    "email": "maria@example.com",
    "phone": "0917-123-4567",
    "password": "secret123",
    "password_confirmation": "secret123",
    "property_id": "uuid-of-property",
    "room_number": "101"
}
```

**Validation Rules:**

| Field | Rules |
|-------|-------|
| name | required, string, max:100 |
| email | required, email, unique:tenants |
| phone | required, string, max:20 |
| password | required, min:6, confirmed |
| property_id | required, exists:properties,id |
| room_number | required, string |

**Success Response — `201 Created`:**

```json
{
    "message": "Registration submitted. Awaiting approval.",
    "tenant": {
        "id": "uuid",
        "name": "Maria Santos",
        "email": "maria@example.com",
        "status": "pending_approval",
        "property_id": "uuid",
        "room": "101"
    }
}
```

**Errors:**

- `422` — Validation failed (missing fields, duplicate email)
- `409` — Room already reserved or occupied

---

#### `POST /api/login` — Sign In

**Request Body:**

```json
{
    "email": "admin@arirent.com",
    "password": "admin"
}
```

**Success Response — `200 OK`:**

```json
{
    "token": "sanctum-token-string",
    "user": {
        "id": "uuid",
        "name": "Property Manager",
        "email": "admin@arirent.com",
        "role": "admin"
    }
}
```

**Errors:**

- `401` — Invalid credentials
- `403` — Account pending approval or inactive

---

#### `POST /api/logout` — Sign Out

**Headers:** `Authorization: Bearer {token}`

**Success Response — `200 OK`:**

```json
{ "message": "Logged out successfully." }
```

---

#### `GET /api/me` — Current User Profile

**Headers:** `Authorization: Bearer {token}`

**Success Response — `200 OK`:**

```json
{
    "data": {
        "id": "uuid",
        "name": "Property Manager",
        "email": "admin@arirent.com",
        "role": "admin"
    }
}
```

---

### 6.2 Properties

#### `GET /api/properties` — List All Properties

**Success Response — `200 OK`:**

```json
{
    "data": [
        {
            "id": "uuid",
            "name": "AriRent Residences - Makati",
            "city": "Makati",
            "address": "123 Ayala Ave, Makati City",
            "rooms_count": 5,
            "occupied_count": 3
        }
    ]
}
```

---

#### `POST /api/properties` — Create Property

**Request Body:**

```json
{
    "name": "AriRent Heights - Quezon City",
    "city": "Quezon City",
    "address": "45 Timog Ave, Quezon City"
}
```

**Success Response — `201 Created`**

---

### 6.3 Rooms

#### `GET /api/rooms` — List Rooms

**Query Parameters:**

| Param | Description |
|-------|-------------|
| `property_id` | Filter by property |
| `status` | Filter by status (vacant, reserved, occupied) |

**Success Response — `200 OK`:**

```json
{
    "data": [
        {
            "id": "uuid",
            "property_id": "uuid",
            "room_number": "101",
            "rent": 5000.00,
            "status": "vacant",
            "property": {
                "name": "AriRent Residences - Makati"
            }
        }
    ]
}
```

---

### 6.4 Tenants

#### `GET /api/tenants` — List Tenants (Paginated)

**Query Parameters:**

| Param | Description |
|-------|-------------|
| `per_page` | Results per page (default: 15) |
| `status` | Filter: pending_approval, active, inactive |
| `property_id` | Filter by property |
| `search` | Search name, email, username |

**Success Response — `200 OK`:**

```json
{
    "data": [
        {
            "id": "uuid",
            "username": "maria",
            "name": "Maria Santos",
            "email": "maria@example.com",
            "phone": "0917-123-4567",
            "property_id": "uuid",
            "property_name": "AriRent Residences - Makati",
            "room": "101",
            "status": "active",
            "balance": 0.00,
            "water_rate": 500.00,
            "lease_end": "2027-01-15"
        }
    ],
    "links": { "first": "...", "last": "...", "prev": null, "next": "..." },
    "meta": { "current_page": 1, "per_page": 15, "total": 25 }
}
```

---

#### `GET /api/tenants/{id}` — Show Tenant

**Success Response — `200 OK`**

**Errors:** `404 Not Found`

---

#### `PUT /api/tenants/{id}` — Update Tenant

**Request Body (partial updates allowed):**

```json
{
    "water_rate": 600.00,
    "lease_end": "2027-12-31"
}
```

**Success Response — `200 OK`**

---

#### `POST /api/tenants/{id}/approve` — Approve Registration

**Success Response — `200 OK`:**

```json
{ "message": "Tenant approved successfully." }
```

**Side Effects:** Room status changes from `reserved` → `occupied`

**Errors:**

- `404` — Tenant not found
- `409` — Room already occupied by another tenant

---

#### `POST /api/tenants/{id}/reject` — Reject Registration

**Success Response — `200 OK`:**

```json
{ "message": "Tenant application rejected." }
```

**Side Effects:** Room status changes from `reserved` → `vacant`

---

#### `POST /api/tenants/{id}/vacate` — End Lease

**Success Response — `200 OK`:**

```json
{ "message": "Tenant vacated. Room is now vacant." }
```

**Side Effects:** Room status → `vacant`, tenant status → `inactive`

---

#### `DELETE /api/tenants/{id}` — Delete Tenant

**Success Response — `204 No Content`**

---

### 6.5 Utility Readings

#### `GET /api/readings` — List Readings

**Query Parameters:**

| Param | Description |
|-------|-------------|
| `tenant_id` | Filter by tenant |

---

#### `POST /api/readings` — Create Reading

**Request Body:**

```json
{
    "tenant_id": "uuid",
    "prev_reading": 1000.0,
    "curr_reading": 1150.0,
    "date": "2026-09-01"
}
```

**Validation Rules:**

| Field | Rules |
|-------|-------|
| tenant_id | required, exists:tenants,id |
| prev_reading | required, numeric, min:0 |
| curr_reading | required, numeric, gte:prev_reading |
| date | required, date |

**Auto-computed:** `usage_kwh = curr - prev`, `amount = usage × elecRate`

---

### 6.6 Bills

#### `GET /api/bills` — List Bills (Paginated)

**Query Parameters:**

| Param | Description |
|-------|-------------|
| `per_page` | Results per page |
| `tenant_id` | Filter by tenant |
| `status` | unpaid, pending_verification, paid |

---

#### `GET /api/bills/{id}` — Show Bill

---

#### `POST /api/bills/generate` — Batch Generate Monthly Invoices

**Request Body:**

```json
{
    "date": "2026-09-01"
}
```

**Behavior:** Creates bills for all `active` tenants who don't already have a bill for the given month.

**Success Response — `200 OK`:**

```json
{
    "message": "Bills generated.",
    "generated": 12,
    "skipped": 3
}
```

**Bill Calculation:**

```
totalAmount = rent + electricity + water + lateFee

rent       = room.rent (from rooms table)
electricity = usage_kwh × elecRate (from settings)
water      = tenant.water_rate (or settings.waterRate fallback)
lateFee    = ₱250 per unpaid bill older than 30 days
```

---

#### `PUT /api/bills/{id}` — Update Bill

**Request Body:**

```json
{
    "rent": 5500.00,
    "status": "paid"
}
```

**Side Effects:** Tenant balance is automatically reconciled when status or amount changes.

---

#### `DELETE /api/bills/{id}` — Delete Bill

**Side Effects:** If bill was unpaid, tenant balance is reduced by the bill amount.

---

#### `POST /api/bills/{id}/verify` — Verify GCash Payment

**Request Body:**

```json
{
    "approved": true,
    "reject_reason": ""
}
```

**When approved (`true`):**

- Bill status → `paid`
- Tenant balance reduced by bill amount
- `approved_date` set to now

**When rejected (`false`):**

- Bill status → `unpaid`
- `reject_reason` recorded

---

### 6.7 Maintenance Tickets

#### `GET /api/maintenance` — List Tickets

**Query Parameters:**

| Param | Description |
|-------|-------------|
| `tenant_id` | Filter by tenant |
| `status` | pending, in_progress, resolved |
| `property_id` | Filter by property |

---

#### `POST /api/maintenance` — Create Ticket

**Request Body:**

```json
{
    "tenant_id": "uuid",
    "type": "plumbing",
    "description": "Leaking faucet in bathroom",
    "priority": "urgent",
    "photo_url": "path/to/photo.jpg"
}
```

**Validation Rules:**

| Field | Rules |
|-------|-------|
| tenant_id | required, exists:tenants,id |
| type | required, in:plumbing,electrical,appliances,general |
| description | required, string |
| priority | required, in:normal,urgent |

**Auto-set:** `status = pending`, `date = now()`

---

#### `PUT /api/maintenance/{id}` — Update Ticket

**Request Body:**

```json
{
    "status": "in_progress",
    "technician_name": "Juan Repairman",
    "admin_notes": "Scheduled for tomorrow morning"
}
```

**When status → `resolved`:**

- `resolved_date` auto-set

---

#### `DELETE /api/maintenance/{id}` — Delete Ticket

---

### 6.8 Settings

#### `GET /api/settings` — Get Current Settings

**Success Response — `200 OK`:**

```json
{
    "data": {
        "elec_rate": 15.00,
        "water_rate": 500.00,
        "gcash_name": "ARIRENT PROPERTY MANAGEMENT",
        "gcash_number": "0917-888-9999",
        "gcash_qr_path": "/assets/gcash-qr.svg"
    }
}
```

---

#### `PUT /api/settings` — Update Settings

**Request Body (partial):**

```json
{
    "elec_rate": 16.50,
    "gcash_name": "ARIRENT PROPERTIES INC"
}
```

---

### 6.9 Dashboard

#### `GET /api/dashboard/stats` — Aggregated Stats

**Query Parameters:**

| Param | Description |
|-------|-------------|
| `property_id` | Filter stats by property (optional) |

**Success Response — `200 OK`:**

```json
{
    "data": {
        "total_revenue": 45000.00,
        "occupancy_rate": 70,
        "occupied_rooms": 7,
        "total_rooms": 10,
        "pending_applications": 2,
        "pending_payments": 3500.00,
        "recent_maintenance": [
            {
                "id": "M1234",
                "tenant_name": "Juan Dela Cruz",
                "room": "102",
                "type": "plumbing",
                "status": "pending"
            }
        ]
    }
}
```

---

## 7. Architecture Explanation

### Layer Responsibilities

| Layer | Responsibility | Example |
|-------|---------------|---------|
| **Route** | Maps HTTP verb + URI to controller action | `Route::post('/tenants/{id}/approve', ...)` |
| **Controller** | Receives request, delegates to service, returns response | `TenantController::approve()` |
| **Form Request** | Validates and authorizes incoming data | `StoreBillRequest`, `UpdateTenantRequest` |
| **Service** | Business logic, coordinates between controller and repository | `BillService::generateMonthlyInvoices()` |
| **Repository Interface** | Defines data-access contract (no Eloquent details) | `TenantRepositoryInterface` |
| **Repository** | Concrete Eloquent implementation of the interface | `TenantRepository` |
| **Model** | Represents database table, defines relationships | `Tenant`, `Bill` |
| **API Resource** | Controls the public JSON response shape | `TenantResource`, `BillResource` |

### Dependency Injection

```php
// Controller receives Service through constructor
class TenantController extends Controller
{
    public function __construct(
        private TenantService $tenantService
    ) {}
}

// Service receives Repository Interface (not concrete class)
class TenantService
{
    public function __construct(
        private TenantRepositoryInterface $tenants
    ) {}
}

// Binding in AppServiceProvider
$this->app->bind(TenantRepositoryInterface::class, TenantRepository::class);
```

### Why Layered Architecture?

**Separation of responsibilities.** Each layer answers one question: the Controller asks "how do I turn this HTTP request into an HTTP response?", the Form Request asks "is this input valid?", the Service asks "what does the business need to happen?", the Repository asks "how do I read/write this data?", and the Model asks "what does this data look like?".

**Maintainability.** A change to how tenants are queried only touches `TenantRepository`. A change to business rules only touches `TenantService`. Changes don't ripple across unrelated code.

**Testability.** `TenantService` depends on `TenantRepositoryInterface`, so it can be unit-tested with a mock repository — no database required. Feature tests hit real HTTP endpoints without knowing internal query logic.

**Reusability.** Business rules live once in the Service layer and are reachable from any entry point — HTTP controller, console command, or queued job — without duplication.

**Dependency management.** Constructor-injecting abstractions means each class only knows about what it needs. Laravel's container assembles the chain automatically.

---

## 8. Data Flow Example — `POST /api/bills/generate`

```
1. Route: api.php matches POST /api/bills/generate
         → BillController@generate
2. Controller: Calls $this->billService->generateMonthlyInvoices($request->validated())
3. Service: Iterates active tenants, checks for existing bills this month,
            calls calculateTenantBillDetails() for each, then delegates
            persistence to $this->bills->create($billData)
4. Repository: Bill::create($data) — only place Eloquent is touched
5. Model: Eloquent issues INSERT against bills table
6. Response: New bills returned through BillResource with 201 status
```

---

## 9. Running Tests

```bash
# Run all tests
docker compose exec app php artisan test

# Run specific test file
docker compose exec app php artisan test tests/Feature/TenantApiTest.php

# Run with verbose output
docker compose exec app php artisan test --verbose
```

Tests run against an **in-memory SQLite database** (configured in `phpunit.xml`), so no database setup is required.

---

## 10. Docker Configuration

### docker-compose.yaml (Development)

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    volumes:
      - .:/var/www/html
    depends_on:
      - db
    networks:
      - arirent-network

  web:
    image: nginx:alpine
    ports:
      - "3001:80"
    volumes:
      - .:/var/www/html
      - ./docker/nginx/default.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - app
    networks:
      - arirent-network

  db:
    image: mysql:8.0
    ports:
      - "3306:3306"
    environment:
      MYSQL_DATABASE: arirent
      MYSQL_USER: arirent
      MYSQL_PASSWORD: secret
      MYSQL_ROOT_PASSWORD: rootsecret
    volumes:
      - arirent-db-data:/var/lib/mysql
    networks:
      - arirent-network

networks:
  arirent-network:

volumes:
  arirent-db-data:
```

---

## 11. Environment Variables (.env)

```env
APP_NAME=AriRent
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:3001

DB_CONNECTION=mysql
DB_HOST=db
DB_PORT=3306
DB_DATABASE=arirent
DB_USERNAME=arirent
DB_PASSWORD=secret

SESSION_DRIVER=cookie
CACHE_DRIVER=file
QUEUE_CONNECTION=sync
```
