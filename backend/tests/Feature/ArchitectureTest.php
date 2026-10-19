<?php

namespace Tests\Feature;

use App\Repositories\Contracts\BillRepositoryInterface;
use App\Repositories\Contracts\MaintenanceRepositoryInterface;
use App\Repositories\Contracts\PropertyRepositoryInterface;
use App\Repositories\Contracts\ReadingRepositoryInterface;
use App\Repositories\Contracts\RoomRepositoryInterface;
use App\Repositories\Contracts\TenantRepositoryInterface;
use App\Repositories\Eloquent\EloquentBillRepository;
use App\Repositories\Eloquent\EloquentMaintenanceRepository;
use App\Repositories\Eloquent\EloquentPropertyRepository;
use App\Repositories\Eloquent\EloquentReadingRepository;
use App\Repositories\Eloquent\EloquentRoomRepository;
use App\Repositories\Eloquent\EloquentTenantRepository;
use App\Services\BillService;
use App\Services\PaymentService;
use App\Services\PropertyService;
use App\Services\TenantService;
use App\Services\UtilityService;
use Tests\TestCase;

class ArchitectureTest extends TestCase
{
    public function test_repository_interfaces_resolve_to_eloquent_implementations(): void
    {
        $this->assertInstanceOf(EloquentTenantRepository::class, app(TenantRepositoryInterface::class));
        $this->assertInstanceOf(EloquentBillRepository::class, app(BillRepositoryInterface::class));
        $this->assertInstanceOf(EloquentReadingRepository::class, app(ReadingRepositoryInterface::class));
        $this->assertInstanceOf(EloquentPropertyRepository::class, app(PropertyRepositoryInterface::class));
        $this->assertInstanceOf(EloquentRoomRepository::class, app(RoomRepositoryInterface::class));
        $this->assertInstanceOf(EloquentMaintenanceRepository::class, app(MaintenanceRepositoryInterface::class));
    }

    public function test_domain_services_resolve_correctly_with_autowiring(): void
    {
        $this->assertInstanceOf(TenantService::class, app(TenantService::class));
        $this->assertInstanceOf(BillService::class, app(BillService::class));
        $this->assertInstanceOf(PaymentService::class, app(PaymentService::class));
        $this->assertInstanceOf(UtilityService::class, app(UtilityService::class));
        $this->assertInstanceOf(PropertyService::class, app(PropertyService::class));
    }
}
