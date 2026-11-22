# AriRent Backend — Laravel REST API

Laravel 12 REST API for the **AriRent Rental & Property Management System**, structured with strict **Layered Architecture**:

```text
Route → Middleware → Controller → Form Request → Service → Repository Interface → Repository → Model → API Resource
```

For full architecture diagrams, database schema, and API endpoint documentation, see [`../BACKEND.md`](../BACKEND.md).

## Quick Commands

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve --port=3001
php artisan test
```
