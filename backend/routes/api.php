<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BillController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\ExcessChargeController;
use App\Http\Controllers\FileController;
use App\Http\Controllers\MaintenanceController;
use App\Http\Controllers\PropertyController;
use App\Http\Controllers\ReadingController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\RoomController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\TenantController;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'status' => 'healthy',
        'message' => 'AriRent API is running successfully!',
        'database' => 'connected',
        'timestamp' => now()->toDateTimeString(),
    ]);
});

// Public Auth routes
Route::middleware('throttle:login')->group(function () {
    Route::post('/login', [AuthController::class, 'login'])->name('login');
    Route::post('/auth/login', [AuthController::class, 'login']);
});

Route::middleware('throttle:register')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/auth/register', [AuthController::class, 'register']);
});

// Public room and property browsing
Route::get('/properties', [PropertyController::class, 'index']);
Route::get('/properties/{id}', [PropertyController::class, 'show']);
Route::get('/rooms', [RoomController::class, 'index']);

// Public Xendit webhook callback
Route::post('/webhooks/xendit', [BillController::class, 'xenditWebhook']);

// Signed, short-lived URLs for private uploads.
Route::get('/files/{path}', [FileController::class, 'show'])
    ->where('path', '.*')
    ->middleware('signed')
    ->name('files.show');

// Protected routes (Sanctum)
Route::middleware('auth:sanctum')->group(function () {
    // Auth & Profile
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/change-password', [AuthController::class, 'changePassword'])->middleware('throttle:5,1');
    Route::post('/auth/change-password', [AuthController::class, 'changePassword'])->middleware('throttle:5,1');
    Route::get('/user', [AuthController::class, 'me']);

    // Shared / Role-Scoped Endpoints (Tenants see/act on own records; Admins see all)
    Route::get('/tenants/{id}', [TenantController::class, 'show']);
    Route::put('/tenants/{id}', [TenantController::class, 'update']);

    Route::get('/bills', [BillController::class, 'index']);
    Route::get('/bills/delinquencies', [BillController::class, 'delinquencies'])->middleware('admin');
    Route::get('/bills/{id}', [BillController::class, 'show']);
    Route::post('/bills/{id}/pay', [BillController::class, 'pay']);
    Route::post('/bills/{id}/payment', [BillController::class, 'pay']);
    Route::post('/bills/{id}/xendit/checkout', [BillController::class, 'xenditCheckout']);
    Route::post('/bills/{id}/xendit/verify', [BillController::class, 'xenditVerify']);

    Route::get('/excess-charges', [ExcessChargeController::class, 'index']);

    Route::get('/readings', [ReadingController::class, 'index']);
    Route::get('/readings/{id}', [ReadingController::class, 'show']);

    Route::get('/settings', [SettingsController::class, 'index']);
    Route::get('/tenant/dashboard', [DashboardController::class, 'tenantDashboard']);

    Route::get('/maintenance', [MaintenanceController::class, 'index']);
    Route::post('/maintenance', [MaintenanceController::class, 'store']);

    Route::get('/documents', [DocumentController::class, 'index']);

    // Admin-Only Routes
    Route::middleware('admin')->group(function () {
        // Properties & Rooms Management
        Route::post('/properties', [PropertyController::class, 'store']);
        Route::put('/properties/{id}', [PropertyController::class, 'update']);
        Route::delete('/properties/{id}', [PropertyController::class, 'destroy']);
        Route::post('/rooms', [RoomController::class, 'store']);
        Route::put('/rooms/{id}', [RoomController::class, 'update']);
        Route::delete('/rooms/{id}', [RoomController::class, 'destroy']);

        // Tenants Management
        Route::get('/tenants', [TenantController::class, 'index']);
        Route::post('/tenants/{id}/approve', [TenantController::class, 'approve']);
        Route::post('/tenants/{id}/reject', [TenantController::class, 'reject']);
        Route::post('/tenants/{id}/vacate', [TenantController::class, 'vacate']);
        Route::delete('/tenants/{id}', [TenantController::class, 'destroy']);

        // Billing & Payment Management
        Route::post('/bills/bulk-delete', [BillController::class, 'bulkDestroy']);
        Route::post('/bills', [BillController::class, 'store']);
        Route::put('/bills/{id}', [BillController::class, 'update']);
        Route::post('/bills/generate', [BillController::class, 'generate']);
        Route::post('/bills/{id}/direct-payment', [BillController::class, 'directPayment']);
        Route::post('/bills/{id}/verify', [BillController::class, 'verify']);
        Route::post('/bills/{id}/void', [BillController::class, 'void']);
        Route::delete('/bills/{id}', [BillController::class, 'destroy']);

        // Excess Charges
        Route::post('/excess-charges', [ExcessChargeController::class, 'store']);
        Route::delete('/excess-charges/{id}', [ExcessChargeController::class, 'destroy']);

        // Utility Meter Readings
        Route::post('/readings', [ReadingController::class, 'store']);
        Route::delete('/readings/{id}', [ReadingController::class, 'destroy']);

        // System Settings & Rates
        Route::put('/settings', [SettingsController::class, 'update']);
        Route::post('/settings', [SettingsController::class, 'update']);

        // Dashboard & Reports Analytics
        Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
        Route::get('/reports/financial', [ReportController::class, 'financial']);

        // Maintenance Ticket Resolution
        Route::put('/maintenance/{id}', [MaintenanceController::class, 'update']);
        Route::patch('/maintenance/{id}', [MaintenanceController::class, 'update']);
        Route::delete('/maintenance/{id}', [MaintenanceController::class, 'destroy']);

        // Property Documents Publishing
        Route::post('/documents', [DocumentController::class, 'store']);
        Route::delete('/documents/{id}', [DocumentController::class, 'destroy']);
    });
});
