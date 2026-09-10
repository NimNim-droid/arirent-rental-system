<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BillController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\MaintenanceController;
use App\Http\Controllers\PropertyController;
use App\Http\Controllers\ReadingController;
use App\Http\Controllers\RoomController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\TenantController;

Route::get('/health', function () {
    return response()->json([
        'status' => 'healthy',
        'message' => 'AriRent API is running successfully!',
        'database' => 'connected',
        'timestamp' => now()->toDateTimeString(),
    ]);
});

// Public Auth routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/auth/register', [AuthController::class, 'register']);

// Public room and property browsing
Route::get('/properties', [PropertyController::class, 'index']);
Route::get('/properties/{id}', [PropertyController::class, 'show']);
Route::get('/rooms', [RoomController::class, 'index']);

// Protected routes (Sanctum)
Route::middleware('auth:sanctum')->group(function () {
    // Auth & Profile
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'me']);

    // Properties & Rooms Management
    Route::post('/properties', [PropertyController::class, 'store']);
    Route::post('/rooms', [RoomController::class, 'store']);

    // Tenants Management
    Route::get('/tenants', [TenantController::class, 'index']);
    Route::get('/tenants/{id}', [TenantController::class, 'show']);
    Route::put('/tenants/{id}', [TenantController::class, 'update']);
    Route::post('/tenants/{id}/approve', [TenantController::class, 'approve']);
    Route::post('/tenants/{id}/reject', [TenantController::class, 'reject']);
    Route::post('/tenants/{id}/vacate', [TenantController::class, 'vacate']);
    Route::delete('/tenants/{id}', [TenantController::class, 'destroy']);

    // Billing & GCash Payment Management
    Route::get('/bills', [BillController::class, 'index']);
    Route::get('/bills/{id}', [BillController::class, 'show']);
    Route::post('/bills', [BillController::class, 'store']);
    Route::post('/bills/generate', [BillController::class, 'generate']);
    Route::post('/bills/{id}/pay', [BillController::class, 'pay']);
    Route::post('/bills/{id}/payment', [BillController::class, 'pay']);
    Route::post('/bills/{id}/verify', [BillController::class, 'verify']);
    Route::delete('/bills/{id}', [BillController::class, 'destroy']);

    // Utility Meter Readings
    Route::get('/readings', [ReadingController::class, 'index']);
    Route::get('/readings/{id}', [ReadingController::class, 'show']);
    Route::post('/readings', [ReadingController::class, 'store']);
    Route::delete('/readings/{id}', [ReadingController::class, 'destroy']);

    // System Settings & Rates
    Route::get('/settings', [SettingsController::class, 'index']);
    Route::put('/settings', [SettingsController::class, 'update']);
    Route::post('/settings', [SettingsController::class, 'update']);

    // Dashboard Analytics
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('/tenant/dashboard', [DashboardController::class, 'tenantDashboard']);

    // Maintenance Tickets
    Route::get('/maintenance', [MaintenanceController::class, 'index']);
    Route::post('/maintenance', [MaintenanceController::class, 'store']);
    Route::put('/maintenance/{id}', [MaintenanceController::class, 'update']);
    Route::patch('/maintenance/{id}', [MaintenanceController::class, 'update']);
});


