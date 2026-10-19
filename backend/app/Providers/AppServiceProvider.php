<?php

namespace App\Providers;

use App\Repositories\Contracts\BillRepositoryInterface;
use App\Repositories\Contracts\MaintenanceRepositoryInterface;
use App\Repositories\Contracts\PropertyRepositoryInterface;
use App\Repositories\Contracts\ReadingRepositoryInterface;
use App\Repositories\Contracts\RoomRepositoryInterface;
use App\Repositories\Contracts\SettingsRepositoryInterface;
use App\Repositories\Contracts\TenantRepositoryInterface;
use App\Repositories\Eloquent\EloquentBillRepository;
use App\Repositories\Eloquent\EloquentMaintenanceRepository;
use App\Repositories\Eloquent\EloquentPropertyRepository;
use App\Repositories\Eloquent\EloquentReadingRepository;
use App\Repositories\Eloquent\EloquentRoomRepository;
use App\Repositories\Eloquent\EloquentSettingsRepository;
use App\Repositories\Eloquent\EloquentTenantRepository;
use Illuminate\Support\ServiceProvider;

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
        $this->app->bind(MaintenanceRepositoryInterface::class, EloquentMaintenanceRepository::class);
        $this->app->bind(SettingsRepositoryInterface::class, EloquentSettingsRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
