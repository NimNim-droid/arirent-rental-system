<?php

namespace Tests\Feature;

use App\Repositories\Contracts\BillRepositoryInterface;
use App\Repositories\Contracts\DocumentRepositoryInterface;
use App\Repositories\Contracts\ExcessChargeRepositoryInterface;
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
use App\Services\AuthService;
use App\Services\BillService;
use App\Services\DashboardService;
use App\Services\DocumentService;
use App\Services\ExcessChargeService;
use App\Services\MaintenanceService;
use App\Services\PaymentService;
use App\Services\PropertyService;
use App\Services\ReportService;
use App\Services\SettingsService;
use App\Services\TenantService;
use App\Services\UtilityService;
use App\Services\XenditService;
use Tests\TestCase;

class ArchitectureTest extends TestCase
{
    public function test_repository_interfaces_resolve_to_expected_implementations(): void
    {
        $this->assertInstanceOf(EloquentTenantRepository::class, app(TenantRepositoryInterface::class));
        $this->assertInstanceOf(EloquentBillRepository::class, app(BillRepositoryInterface::class));
        $this->assertInstanceOf(EloquentReadingRepository::class, app(ReadingRepositoryInterface::class));
        $this->assertInstanceOf(EloquentPropertyRepository::class, app(PropertyRepositoryInterface::class));
        $this->assertInstanceOf(EloquentRoomRepository::class, app(RoomRepositoryInterface::class));
        $this->assertInstanceOf(EloquentMaintenanceRepository::class, app(MaintenanceRepositoryInterface::class));
        $this->assertInstanceOf(EloquentSettingsRepository::class, app(SettingsRepositoryInterface::class));
        $this->assertInstanceOf(EloquentUserRepository::class, app(UserRepositoryInterface::class));
        $this->assertInstanceOf(EloquentPaymentRepository::class, app(PaymentRepositoryInterface::class));
        $this->assertInstanceOf(EloquentExcessChargeRepository::class, app(ExcessChargeRepositoryInterface::class));
        $this->assertInstanceOf(LocalDocumentRepository::class, app(DocumentRepositoryInterface::class));
        $this->assertInstanceOf(EloquentReportRepository::class, app(ReportRepositoryInterface::class));
    }

    public function test_domain_services_resolve_correctly_with_autowiring(): void
    {
        $this->assertInstanceOf(TenantService::class, app(TenantService::class));
        $this->assertInstanceOf(BillService::class, app(BillService::class));
        $this->assertInstanceOf(PaymentService::class, app(PaymentService::class));
        $this->assertInstanceOf(UtilityService::class, app(UtilityService::class));
        $this->assertInstanceOf(PropertyService::class, app(PropertyService::class));
        $this->assertInstanceOf(MaintenanceService::class, app(MaintenanceService::class));
        $this->assertInstanceOf(SettingsService::class, app(SettingsService::class));
        $this->assertInstanceOf(DashboardService::class, app(DashboardService::class));
        $this->assertInstanceOf(AuthService::class, app(AuthService::class));
        $this->assertInstanceOf(ReportService::class, app(ReportService::class));
        $this->assertInstanceOf(DocumentService::class, app(DocumentService::class));
        $this->assertInstanceOf(ExcessChargeService::class, app(ExcessChargeService::class));
        $this->assertInstanceOf(XenditService::class, app(XenditService::class));
    }

    public function test_controllers_do_not_bypass_services_to_access_models_or_repositories(): void
    {
        $controllerFiles = glob(app_path('Http/Controllers/*.php')) ?: [];
        $this->assertNotEmpty($controllerFiles);

        foreach ($controllerFiles as $file) {
            $source = (string) file_get_contents($file);
            $name = basename($file);

            $this->assertDoesNotMatchRegularExpression(
                '/^use\s+App\\\\Models\\\\/m',
                $source,
                "Controller {$name} must not import Eloquent Models directly."
            );
            $this->assertDoesNotMatchRegularExpression(
                '/^use\s+App\\\\Repositories\\\\/m',
                $source,
                "Controller {$name} must not inject Repositories directly; go through a Service."
            );
            $this->assertDoesNotMatchRegularExpression(
                '/\b(DB|Storage)::/',
                $source,
                "Controller {$name} must not access DB or Storage facades directly."
            );
            $this->assertDoesNotMatchRegularExpression(
                '/->validate\s*\(/',
                $source,
                "Controller {$name} must use Form Request classes instead of inline \$request->validate()."
            );
        }
    }

    public function test_services_do_not_query_models_directly_or_throw_http_exceptions(): void
    {
        $serviceFiles = glob(app_path('Services/*.php')) ?: [];
        $this->assertNotEmpty($serviceFiles);

        foreach ($serviceFiles as $file) {
            $source = (string) file_get_contents($file);
            $name = basename($file);

            $this->assertDoesNotMatchRegularExpression(
                '/\b(Bill|ExcessCharge|MaintenanceTicket|Payment|Property|Room|Setting|Tenant|User|UtilityReading)::/',
                $source,
                "Service {$name} must query persistence via Repository interfaces, not static Model calls."
            );
            $this->assertDoesNotMatchRegularExpression(
                '/HttpException/',
                $source,
                "Service {$name} must not depend on Symfony HttpException."
            );
        }
    }
}
