<?php

namespace App\Providers;

use App\Repositories\Contracts\BillRepositoryInterface;
use App\Repositories\Contracts\DocumentRepositoryInterface;
use App\Repositories\Contracts\ExcessChargeRepositoryInterface;
use App\Repositories\Contracts\InquiryRepositoryInterface;
use App\Repositories\Contracts\ListingPhotoRepositoryInterface;
use App\Repositories\Contracts\MaintenanceRepositoryInterface;
use App\Repositories\Contracts\PaymentRepositoryInterface;
use App\Repositories\Contracts\PropertyRepositoryInterface;
use App\Repositories\Contracts\ReadingRepositoryInterface;
use App\Repositories\Contracts\ReportRepositoryInterface;
use App\Repositories\Contracts\RoomRepositoryInterface;
use App\Repositories\Contracts\SettingsRepositoryInterface;
use App\Repositories\Contracts\TenantRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Repositories\Eloquent\EloquentBillRepository;
use App\Repositories\Eloquent\EloquentExcessChargeRepository;
use App\Repositories\Eloquent\EloquentInquiryRepository;
use App\Repositories\Eloquent\EloquentListingPhotoRepository;
use App\Repositories\Eloquent\EloquentMaintenanceRepository;
use App\Repositories\Eloquent\EloquentPaymentRepository;
use App\Repositories\Eloquent\EloquentPropertyRepository;
use App\Repositories\Eloquent\EloquentReadingRepository;
use App\Repositories\Eloquent\EloquentReportRepository;
use App\Repositories\Eloquent\EloquentRoomRepository;
use App\Repositories\Eloquent\EloquentSettingsRepository;
use App\Repositories\Eloquent\EloquentTenantRepository;
use App\Repositories\Eloquent\EloquentUserRepository;
use App\Repositories\Storage\LocalDocumentRepository;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(TenantRepositoryInterface::class, EloquentTenantRepository::class);
        $this->app->bind(BillRepositoryInterface::class, EloquentBillRepository::class);
        $this->app->bind(ReadingRepositoryInterface::class, EloquentReadingRepository::class);
        $this->app->bind(PropertyRepositoryInterface::class, EloquentPropertyRepository::class);
        $this->app->bind(RoomRepositoryInterface::class, EloquentRoomRepository::class);
        $this->app->bind(ListingPhotoRepositoryInterface::class, EloquentListingPhotoRepository::class);
        $this->app->bind(InquiryRepositoryInterface::class, EloquentInquiryRepository::class);
        $this->app->bind(MaintenanceRepositoryInterface::class, EloquentMaintenanceRepository::class);
        $this->app->bind(SettingsRepositoryInterface::class, EloquentSettingsRepository::class);
        $this->app->bind(UserRepositoryInterface::class, EloquentUserRepository::class);
        $this->app->bind(PaymentRepositoryInterface::class, EloquentPaymentRepository::class);
        $this->app->bind(ExcessChargeRepositoryInterface::class, EloquentExcessChargeRepository::class);
        $this->app->bind(DocumentRepositoryInterface::class, LocalDocumentRepository::class);
        $this->app->bind(ReportRepositoryInterface::class, EloquentReportRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('login', function (Request $request) {
            $email = $request->input('email');
            $email = is_string($email) ? Str::lower($email) : '';

            return [
                Limit::perMinute(5)->by($email.'|'.$request->ip()),
                Limit::perMinute(20)->by($request->ip()),
            ];
        });

        RateLimiter::for('register', function (Request $request) {
            return [
                Limit::perMinute(3)->by($request->ip()),
                Limit::perHour(10)->by($request->ip()),
            ];
        });

        RateLimiter::for('inquiries', function (Request $request) {
            return [
                Limit::perMinute(5)->by($request->ip()),
                Limit::perHour(20)->by($request->ip()),
            ];
        });
    }
}
